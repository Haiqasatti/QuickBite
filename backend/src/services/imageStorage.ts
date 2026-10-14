import { lookup } from "node:dns/promises";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fileTypeFromBuffer } from "file-type";
import ipaddr from "ipaddr.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export const uploadsDirectory = fileURLToPath(new URL("../../uploads/", import.meta.url));
const imageDirectory = join(uploadsDirectory, "images");

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export class ImageInputError extends Error {
  constructor(message: string, readonly statusCode = 400) {
    super(message);
    this.name = "ImageInputError";
  }
}

async function persistImage(buffer: Buffer, declaredType: string): Promise<string> {
  const normalizedType = declaredType.split(";", 1)[0].trim().toLowerCase();
  const extension = allowedTypes.get(normalizedType);
  if (!extension) {
    throw new ImageInputError("Only JPEG, PNG, and WebP images are supported.");
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || detected.mime !== normalizedType || !allowedTypes.has(detected.mime)) {
    throw new ImageInputError("The file contents do not match a valid JPEG, PNG, or WebP image.");
  }

  await mkdir(imageDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(join(imageDirectory, filename), buffer, { flag: "wx" });
  return `/uploads/images/${filename}`;
}

export async function saveUploadedImage(buffer: Buffer, declaredType: string): Promise<string> {
  if (buffer.byteLength === 0) throw new ImageInputError("Choose an image file to upload.");
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new ImageInputError("Images must be 5 MB or smaller.", 413);
  return persistImage(buffer, declaredType);
}

function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
      return parsed.toIPv4Address().range() === "unicast";
    }
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

async function resolvePublicAddress(hostname: string): Promise<{ address: string; family: number }> {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "metadata.google.internal" ||
    normalized === "metadata"
  ) {
    throw new ImageInputError("That host is not allowed. Use a public, directly accessible image URL.");
  }

  const literalFamily = ipaddr.isValid(normalized)
    ? ipaddr.parse(normalized).kind() === "ipv4" ? 4 : 6
    : 0;
  let addresses: Array<{ address: string; family: number }>;
  if (literalFamily) {
    addresses = [{ address: normalized, family: literalFamily }];
  } else {
    let timeout: NodeJS.Timeout | undefined;
    try {
      addresses = await Promise.race([
        lookup(normalized, { all: true, verbatim: true }),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new ImageInputError("The image host lookup timed out.", 504)), REQUEST_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ImageInputError("That host resolves to a private or reserved network and cannot be imported.");
  }

  return addresses[0];
}

interface DownloadedImage {
  buffer: Buffer;
  contentType: string;
}

async function downloadOnce(url: URL): Promise<{ redirect?: string; image?: DownloadedImage }> {
  const pinnedAddress = await resolvePublicAddress(url.hostname);
  const requestFunction = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };

    const timeout = setTimeout(() => request.destroy(new Error("Image download timed out.")), REQUEST_TIMEOUT_MS);
    const request = requestFunction(
      url,
      {
        method: "GET",
        agent: false,
        headers: { Accept: "image/jpeg, image/png, image/webp" },
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [pinnedAddress]);
          else callback(null, pinnedAddress.address, pinnedAddress.family);
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = response.headers.location;
          response.resume();
          if (!location) {
            finish(() => reject(new ImageInputError("The image server returned an invalid redirect.", 502)));
            return;
          }
          try {
            const redirect = new URL(location, url).toString();
            finish(() => resolve({ redirect }));
          } catch {
            finish(() => reject(new ImageInputError("The image server returned an invalid redirect.", 502)));
          }
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          finish(() => reject(new ImageInputError(`The image server returned HTTP ${status}. Check that the URL is a direct image link.`, 502)));
          return;
        }

        const contentType = response.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() ?? "";
        if (!allowedTypes.has(contentType)) {
          response.resume();
          finish(() => reject(new ImageInputError("The URL must point directly to a JPEG, PNG, or WebP image, not a webpage.")));
          return;
        }

        const contentLength = Number(response.headers["content-length"]);
        if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
          response.resume();
          finish(() => reject(new ImageInputError("The image is larger than the 5 MB limit.", 413)));
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;
        response.on("data", (chunk: Buffer | string) => {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += bytes.byteLength;
          if (totalBytes > MAX_IMAGE_BYTES) {
            response.destroy(new Error("Image exceeds the 5 MB limit."));
            return;
          }
          chunks.push(bytes);
        });
        response.on("end", () =>
          finish(() => resolve({ image: { buffer: Buffer.concat(chunks), contentType } }))
        );
        response.on("error", (error) => finish(() => reject(error)));
      }
    );

    request.on("error", (error) => finish(() => reject(error)));
    request.end();
  });
}

export async function importImageFromUrl(input: string): Promise<string> {
  let currentUrl: URL;
  try {
    currentUrl = new URL(input);
  } catch {
    throw new ImageInputError("Enter a valid direct image URL.");
  }

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (!["https:", "http:"].includes(currentUrl.protocol) || currentUrl.username || currentUrl.password) {
      throw new ImageInputError("Use a public HTTP or HTTPS image URL without embedded credentials.");
    }
    const allowedPort = currentUrl.protocol === "https:" ? "443" : "80";
    if (currentUrl.port && currentUrl.port !== allowedPort) {
      throw new ImageInputError("Image imports are only allowed over standard HTTP or HTTPS ports.");
    }

    try {
      const result = await downloadOnce(currentUrl);
      if (result.redirect) {
        if (redirects === MAX_REDIRECTS) throw new ImageInputError("The image URL redirected too many times.", 502);
        currentUrl = new URL(result.redirect);
        continue;
      }
      if (!result.image) throw new ImageInputError("The image response was empty.", 502);
      return persistImage(result.image.buffer, result.image.contentType);
    } catch (error) {
      if (error instanceof ImageInputError) throw error;
      if (error instanceof Error && error.message.includes("5 MB limit")) {
        throw new ImageInputError("The image is larger than the 5 MB limit.", 413);
      }
      if (error instanceof Error && error.message.includes("timed out")) {
        throw new ImageInputError("The image server took too long to respond.", 504);
      }
      throw new ImageInputError("Could not download the image. Check that the URL is public and points directly to an image.", 502);
    }
  }

  throw new ImageInputError("The image URL could not be imported.", 502);
}
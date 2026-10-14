import { useState, type ChangeEvent } from "react";
import { imageApi } from "../lib/endpoints";
import { getErrorMessage } from "../lib/api";
import { resolveImageUrl } from "../lib/env";
import { Field } from "./Field";

// Keep this list in sync with images available under frontend/public/images.
export const localImageOptions = [
  { label: "BBQ & Grills", path: "/images/BBQ%20%26%20Grills.jpg" },
  { label: "Biryani", path: "/images/Biryani.jpg" },
  { label: "Cakes", path: "/images/Cakes.jpg" },
  { label: "Chinese", path: "/images/Chinese.jpg" },
  { label: "Desserts", path: "/images/Desserts.jpg" },
];

interface ImagePickerProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function ImagePicker({ label, value, error, onChange }: ImagePickerProps) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const selectedPath = localImageOptions.some((option) => option.path === value) ? value : "";
  const canImport = /^https?:\/\//i.test(value.trim());

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setActionError(null);
    try {
      const result = await imageApi.upload(file);
      onChange(result.image.path);
      setPreviewFailed(false);
    } catch (uploadError) {
      setActionError(getErrorMessage(uploadError));
    } finally {
      setBusy(false);
    }
  }

  async function importUrl() {
    if (!value.trim()) return;

    setBusy(true);
    setActionError(null);
    try {
      const result = await imageApi.importFromUrl(value.trim());
      onChange(result.image.path);
      setPreviewFailed(false);
    } catch (importError) {
      setActionError(getErrorMessage(importError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="image-picker">
      <Field label="Choose a project image (optional)" hint="Select an image already stored in frontend/public/images.">
        {(props) => (
          <select {...props} value={selectedPath} onChange={(event) => onChange(event.target.value)}>
            <option value="">Select a local image</option>
            {localImageOptions.map((option) => (
              <option key={option.path} value={option.path}>
                {option.label} ({option.path})
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Upload an image (optional)" hint="JPG, PNG, or WebP. Maximum size: 5 MB.">
        {(props) => (
          <input {...props} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => void uploadFile(event)} />
        )}
      </Field>
      <Field label={`${label} (optional)`} hint="Paste a direct image URL, then import it to store a local copy." error={error}>
        {(props) => <input {...props} type="text" inputMode="url" value={value} onChange={(event) => { onChange(event.target.value); setPreviewFailed(false); }} />}
      </Field>
      <div className="image-picker-actions">
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !canImport} onClick={() => void importUrl()}>
          {busy ? "Processing image…" : "Import image from URL"}
        </button>
      </div>
      {actionError ? <p className="field-error" role="alert">{actionError}</p> : null}
      {value ? (
        <div className="image-preview" aria-label={`${label} preview`}>
          {previewFailed ? (
            <p className="image-preview-fallback">Preview unavailable</p>
          ) : (
            <img src={resolveImageUrl(value)} alt={`${label} preview`} onError={() => setPreviewFailed(true)} />
          )}
          <span>{value}</span>
        </div>
      ) : null}
    </div>
  );
}
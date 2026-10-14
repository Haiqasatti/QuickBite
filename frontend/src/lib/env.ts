const variables = import.meta.env;
const API_URL = (variables.VITE_API_URL || "https://quick-bite-zja8.vercel.app")
	.replace(/\/+$/, "")
	.replace(/\/api$/i, "");

export const env = {
	apiUrl: `${API_URL}/api`,
	apiOrigin: API_URL,
	currency: variables.VITE_CURRENCY || "PKR",
	contactEmail: variables.VITE_CONTACT_EMAIL || "",
	heroImageUrl: variables.VITE_HERO_IMAGE_URL || "",
};

export function resolveImageUrl(path: string): string {
	return path.startsWith("/uploads/") ? `${env.apiOrigin}${path}` : path;
}

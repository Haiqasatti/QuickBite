const variables = import.meta.env;

export const env = {
	apiUrl: variables.VITE_API_URL || "http://localhost:5000/api",
	apiOrigin: (variables.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/i, ""),
	currency: variables.VITE_CURRENCY || "PKR",
	contactEmail: variables.VITE_CONTACT_EMAIL || "",
	heroImageUrl: variables.VITE_HERO_IMAGE_URL || "",
};

export function resolveImageUrl(path: string): string {
	return path.startsWith("/uploads/") ? `${env.apiOrigin}${path}` : path;
}

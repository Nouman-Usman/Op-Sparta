import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getURL() {
  // In the browser, always derive from the actual origin so dev/prod/preview all work correctly.
  if (typeof window !== "undefined" && window.location.origin) {
    const origin = window.location.origin;
    return origin.endsWith("/") ? origin : `${origin}/`;
  }

  // Server-side: fall back to explicit env vars.
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/";

  url = url.includes("http") ? url : `https://${url}`;
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
}

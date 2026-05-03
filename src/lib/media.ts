/**
 * Rewrites a Supabase Storage object URL to the render/image endpoint so the
 * image is served resized and compressed. Instagram requires photos to be
 * ≤ 8 MB; PNG screenshots can easily exceed that.
 *
 * Non-Supabase URLs are returned unchanged.
 */
export function toInstagramImageUrl(imageUrl: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !imageUrl) return imageUrl;

  try {
    const url = new URL(imageUrl);
    const supabaseHost = new URL(supabaseUrl).host;

    if (url.host !== supabaseHost) return imageUrl;
    if (!url.pathname.includes("/storage/v1/object/public/")) return imageUrl;

    const renderPath = url.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );

    // 1080px wide JPEG at 85% quality — well within Instagram's 8 MB limit
    return `${url.origin}${renderPath}?width=1080&quality=85&format=jpeg`;
  } catch {
    return imageUrl;
  }
}

/**
 * Image Delivery & Performance Optimization Utility for Dalelak
 * Converts uncompressed Google Place, CDN, and Supabase Storage images to optimized responsive formats.
 */

export function getOptimizedImageUrl(url: string | undefined | null, width = 600, height?: number): string {
  if (!url || typeof url !== 'string') return '';

  // 1. Google Place Photos & User Content CDN (responsive WebP resize)
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    const [base] = url.split('=');
    const targetHeight = height || Math.round(width * 0.75);
    return `${base}=w${width}-h${targetHeight}-n-rw`;
  }

  // 2. Supabase Storage Image Transformation (renders WebP/JPEG thumbnail on-the-fly, saves 90%+ bandwidth)
  if (url.includes('/storage/v1/object/public/')) {
    const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const targetHeight = height || Math.round(width * 0.75);
    return `${renderUrl}?width=${width}&height=${targetHeight}&quality=75`;
  }

  // 3. Unsplash Photos CDN (Imgix dynamic WebP compression & exact dimension resize)
  if (url.includes('images.unsplash.com')) {
    const targetHeight = height || Math.round(width * 0.75);
    const [baseUrl] = url.split('?');
    return `${baseUrl}?auto=format&fit=crop&w=${width}&h=${targetHeight}&q=70`;
  }

  return url;
}

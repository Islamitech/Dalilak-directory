export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
}

export async function shareLink(options: ShareOptions): Promise<{ shared: boolean; copied: boolean }> {
  const shareUrl = options.url || (typeof window !== 'undefined' ? window.location.href : '');

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: shareUrl,
      });
      return { shared: true, copied: false };
    } catch {
      // User cancelled or share failed, fallback to clipboard below
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { shared: false, copied: true };
    } catch {
      // Clipboard write failed
    }
  }

  return { shared: false, copied: false };
}

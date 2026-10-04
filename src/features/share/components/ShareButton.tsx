import React, { useState } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { shareLink, ShareOptions } from '../model/shareHelper';
import { IconButton } from '../../../shared/ui';

export interface ShareButtonProps extends ShareOptions {
  className?: string;
  variant?: 'button' | 'icon';
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  className = '',
  variant = 'button',
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleShare = async () => {
    const result = await shareLink({ title, text, url });
    if (result.copied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else if (!result.shared && !result.copied) {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  if (variant === 'icon') {
    return (
      <IconButton
        aria-label={copied ? 'تم نسخ الرابط' : error ? 'تعذر النسخ' : 'مشاركة الرابط'}
        onClick={handleShare}
        size="sm"
        variant="ghost"
        className={`!w-8 !h-8 !rounded-xl transition-colors ${
          copied ? '!bg-emerald-600 !text-white' : '!bg-slate-100 !text-slate-600'
        } ${className}`}
        icon={copied ? <Check className="w-4 h-4" /> : error ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Share2 className="w-4 h-4" />}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${className}`}
      title="مشاركة الرابط"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : error ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> : <Share2 className="w-3.5 h-3.5" />}
      <span>{copied ? 'تم النسخ!' : error ? 'تعذر النسخ' : 'مشاركة'}</span>
    </button>
  );
};

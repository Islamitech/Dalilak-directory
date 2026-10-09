import React from 'react';
import { MessageCircle } from 'lucide-react';

export interface WhatsAppFloatingButtonProps {
  referralCode?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ referralCode }) => {
  const text = encodeURIComponent(
    'مرحباً دليلك، أود الاستفسار عن خدمة في الدليل' + (referralCode ? ` (كود: ${referralCode})` : '')
  );

  return (
    <a
      href={`https://wa.me/201556221141?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex fixed bottom-6 start-6 lg:start-auto lg:end-6 z-30 w-12 h-12 rounded-pill bg-white hover:bg-slate-50 text-emerald-600 border border-slate-200 shadow-xl items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
      title="تواصل معنا عبر واتساب"
      aria-label="WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
    </a>
  );
};

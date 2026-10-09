import React from 'react';
import { PackagesHub } from '../PackagesHub';
import { Business } from '../../types';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button, ButtonLink, PageFrame } from '../../shared/ui';

export interface BusinessPricingViewProps {
  businesses?: Business[];
  onNavigate: (path: string) => void;
}

export const BusinessPricingView: React.FC<BusinessPricingViewProps> = ({
  businesses = [],
  onNavigate,
}) => {
  return (
    <PageFrame
      title="الباقات"
      subtitle="إدراج النشاط في دليل حدائق الأهرام مجاني. الباقات التالية لخدمات التوثيق والتسويق."
      action={
        <Button variant="ghost" size="sm" onClick={() => onNavigate('/for-business')} leadingIcon={<ArrowLeft />}>
          الإدراج المجاني
        </Button>
      }
    >
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <PackagesHub mode="public" businesses={businesses} />
      </div>

      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900">استشارة عن الباقة المناسبة</h2>
          <p className="text-sm font-medium text-slate-600">تُفتح رسالة واتساب جاهزة مع فريق دليلك.</p>
        </div>
        <ButtonLink
          href={`https://wa.me/201556221141?text=${encodeURIComponent('مرحباً دليلك، أود استشارة حول الباقة المناسبة لمنشأتي.')}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          leadingIcon={<MessageCircle className="text-green-600" />}
        >
          واتساب
        </ButtonLink>
      </div>
    </PageFrame>
  );
};

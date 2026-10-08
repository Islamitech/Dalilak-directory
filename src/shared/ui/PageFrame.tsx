import React from 'react';

export interface PageFrameProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  width?: 'narrow' | 'wide';
}

export const PageFrame: React.FC<PageFrameProps> = ({
  title,
  subtitle,
  icon,
  action,
  children,
  width = 'wide',
}) => (
  <div
    className={`mx-auto w-full px-4 py-8 pb-24 sm:px-6 lg:px-8 ${width === 'narrow' ? 'max-w-2xl' : 'max-w-5xl'}`}
    dir="rtl"
  >
    <header className="mb-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          {icon}
          <span>{title}</span>
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
    <div className="space-y-6">{children}</div>
  </div>
);

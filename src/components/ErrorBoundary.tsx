import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Dalilak] Uncaught render error intercepted by ErrorBoundary:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-5 text-center"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <AlertTriangle className="w-8 h-8 text-white" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold text-slate-900">تعذر تحميل الصفحة</h1>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              حدث خطأ غير متوقع أثناء عرض هذه الصفحة. لا تقلق — بياناتك وبحثك لم يتأثرا.
              أعد تحميل الصفحة للمتابعة.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-extrabold shadow-md shadow-amber-500/25 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>إعادة تحميل الصفحة</span>
            </button>

            <a
              href="/"
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-sm font-bold border border-slate-200 transition-colors"
            >
              <MapPin className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>العودة إلى الخريطة الرئيسية</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

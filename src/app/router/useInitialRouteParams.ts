import { extractBusinessIdFromSlug } from '../../utils/directoryUrl';

export interface InitialRouteParams {
  initialBizId: string;
  isPreviewMode: boolean;
  referralCode: string;
}

export function useInitialRouteParams(): InitialRouteParams {
  if (typeof window === 'undefined') {
    return { initialBizId: '', isPreviewMode: false, referralCode: '' };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/biz\/([^/?#]+)/i);
  const pathBizId = pathMatch ? extractBusinessIdFromSlug(pathMatch[1]) : '';
  const rawBizParam =
    urlParams.get('biz') ||
    urlParams.get('place') ||
    urlParams.get('b') ||
    urlParams.get('preview') ||
    urlParams.get('id') ||
    pathBizId ||
    '';

  const idMatch = rawBizParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
  const initialBizId = idMatch ? idMatch[1] : rawBizParam;
  const isPreviewMode = urlParams.has('preview');
  const referralCode = urlParams.get('ref') || urlParams.get('rep') || '';

  return { initialBizId, isPreviewMode, referralCode };
}

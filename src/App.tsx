import React from 'react';
import { DirectoryLoadContext } from './features/catalog';
import { PublicShowcase } from './components/PublicShowcase';
import { useCatalogLifecycle } from './features/catalog';
import { useInitialRouteParams } from './app/router/useInitialRouteParams';
import { Toast } from './shared/ui/Toast';

/**
 * 🏛️ Dalilak Application Composition Root
 * Thin shell connecting global providers, catalog data lifecycle, and views.
 */
export default function App() {
  const { businesses, loading, directoryLoad, syncToastMessage } = useCatalogLifecycle();
  const { initialBizId, isPreviewMode, referralCode } = useInitialRouteParams();

  return (
    <DirectoryLoadContext.Provider value={directoryLoad}>
      <Toast message={syncToastMessage} type="success" />
      <PublicShowcase
        businesses={businesses}
        initialBizId={initialBizId}
        isPreviewMode={isPreviewMode}
        referralCode={referralCode}
        loading={loading}
      />
    </DirectoryLoadContext.Provider>
  );
}

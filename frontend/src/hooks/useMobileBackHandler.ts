"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseMobileBackHandlerOptions {
  activeTab?: string;
  isModalOpen?: boolean;
  onCloseModal?: () => void;
  onReturnHome?: () => void;
  onBack?: () => void;
}

export function useMobileBackHandler({
  activeTab = 'home',
  isModalOpen = false,
  onCloseModal,
  onReturnHome,
  onBack,
}: UseMobileBackHandlerOptions) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen to custom back click event triggered globally by the Capacitor App backButton listener
    const handleCustomBackClick = () => {
      // 1. If a popup or dialog is open, intercept system back and close the popup
      if (isModalOpen && onCloseModal) {
        onCloseModal();
        return;
      }

      // 2. If we are on a secondary tab/page, intercept system back and handle back click
      if (activeTab !== 'home') {
        if (onBack) {
          onBack();
        } else if (onReturnHome) {
          onReturnHome();
        } else {
          router.push('?tab=home', { scroll: false });
        }
        return;
      }
    };

    window.addEventListener('sjs-back-click', handleCustomBackClick);

    // Keep popstate fallback for non-native web browsers
    const handlePopState = (event: PopStateEvent) => {
      handleCustomBackClick();
    };

    if (isModalOpen || activeTab !== 'home') {
      window.history.pushState({ sjsMobileBack: true, tab: activeTab, modal: isModalOpen }, '');
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('sjs-back-click', handleCustomBackClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, isModalOpen, onCloseModal, onReturnHome, onBack, router]);
}

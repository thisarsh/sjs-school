"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseMobileBackHandlerOptions {
  activeTab?: string;
  isModalOpen?: boolean;
  onCloseModal?: () => void;
  onReturnHome?: () => void;
}

export function useMobileBackHandler({
  activeTab = 'home',
  isModalOpen = false,
  onCloseModal,
  onReturnHome,
}: UseMobileBackHandlerOptions) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Whenever a modal opens OR we switch away from home, push a virtual history entry
    // so the native Android / WebView system back button triggers popstate instead of finishing the app activity.
    if (isModalOpen || activeTab !== 'home') {
      window.history.pushState({ sjsMobileBack: true, tab: activeTab, modal: isModalOpen }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If a popup or dialog is open, intercept system back and close the popup
      if (isModalOpen && onCloseModal) {
        onCloseModal();
        return;
      }

      // 2. If we are on a secondary tab or page, intercept system back and return to home
      if (activeTab !== 'home') {
        if (onReturnHome) {
          onReturnHome();
        } else {
          router.push('?tab=home', { scroll: false });
        }
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, isModalOpen, onCloseModal, onReturnHome, router]);
}

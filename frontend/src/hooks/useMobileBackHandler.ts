"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App as CapacitorApp } from '@capacitor/app';

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

    let backButtonListener: any = null;

    const setupListener = async () => {
      try {
        backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
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

          // 3. Otherwise, if canGoBack is true, let it navigate back in history
          if (canGoBack) {
            window.history.back();
          }
        });
      } catch (err) {
        console.warn('Capacitor App plugin not available or not running in native mobile shell.', err);
      }
    };

    setupListener();

    // Keep popstate fallback for non-native web browsers
    const handlePopState = (event: PopStateEvent) => {
      if (isModalOpen && onCloseModal) {
        onCloseModal();
        return;
      }
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

    if (isModalOpen || activeTab !== 'home') {
      window.history.pushState({ sjsMobileBack: true, tab: activeTab, modal: isModalOpen }, '');
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      if (backButtonListener) {
        backButtonListener.then((l: any) => l.remove()).catch(() => {});
      }
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, isModalOpen, onCloseModal, onReturnHome, onBack, router]);
}

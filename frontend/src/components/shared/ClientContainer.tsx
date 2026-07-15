"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";

export default function ClientContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const listenerPromise = (async () => {
      try {
        return await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;
          const searchParams = new URLSearchParams(window.location.search);
          const tab = searchParams.get('tab') || 'home';

          const isPortal = ['/student', '/teacher', '/principal'].includes(currentPath);
          const isNotHome = tab !== 'home';

          if (isPortal && isNotHome) {
            // Dispatch event to page hooks for in-app tab navigation
            window.dispatchEvent(new CustomEvent('sjs-back-click'));
          } else if (isPortal && !isNotHome) {
            // On dashboard portal home tab — minimize app (like native Android apps)
            // This sends app to background instead of killing it
            CapacitorApp.minimizeApp();
          } else {
            // Outside portal, use history back if available, otherwise minimize
            if (canGoBack) {
              window.history.back();
            } else {
              CapacitorApp.minimizeApp();
            }
          }
        });
      } catch (err) {
        console.warn('Capacitor App plugin not running in native mobile container.', err);
        return null;
      }
    })();

    return () => {
      listenerPromise.then(l => {
        if (l) l.remove();
      }).catch(() => {});
    };
  }, []);

  if (isLoginPage) {
    return (
      <div className="login-full-screen-wrapper">
        {children}
      </div>
    );
  }

  return (
    <div className="mobile-app-container">
      {children}
    </div>
  );
}

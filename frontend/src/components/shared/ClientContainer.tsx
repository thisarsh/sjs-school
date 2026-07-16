"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";

export default function ClientContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";
  const lastBackPressRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);

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
            // On a subpage — navigate back through tab history
            window.dispatchEvent(new CustomEvent('sjs-back-click'));
          } else if (isPortal && !isNotHome) {
            // On home tab — double-press to exit
            const now = Date.now();
            if (now - lastBackPressRef.current < 2000) {
              // Second press within 2 seconds — minimize app
              setShowExitToast(false);
              CapacitorApp.minimizeApp();
            } else {
              // First press — show toast
              lastBackPressRef.current = now;
              setShowExitToast(true);
              setTimeout(() => setShowExitToast(false), 2000);
            }
          } else {
            // Outside portal (login page etc.)
            if (canGoBack) {
              window.history.back();
            } else {
              const now = Date.now();
              if (now - lastBackPressRef.current < 2000) {
                setShowExitToast(false);
                CapacitorApp.minimizeApp();
              } else {
                lastBackPressRef.current = now;
                setShowExitToast(true);
                setTimeout(() => setShowExitToast(false), 2000);
              }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingRedirect = window.sessionStorage.getItem('sjs_pending_redirect');
    if (pendingRedirect) {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== pendingRedirect) {
        window.sessionStorage.removeItem('sjs_pending_redirect');
        window.location.href = pendingRedirect;
      }
    }
  }, [pathname]);

  const exitToast = showExitToast ? (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px 24px',
      borderRadius: '24px',
      fontSize: '13px',
      fontWeight: 600,
      zIndex: 99999,
      pointerEvents: 'none',
      animation: 'fadeIn 0.2s ease',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      Press back again to exit
    </div>
  ) : null;

  if (isLoginPage) {
    return (
      <div className="login-full-screen-wrapper">
        {children}
        {exitToast}
      </div>
    );
  }

  return (
    <div className="mobile-app-container">
      {children}
      {exitToast}
    </div>
  );
}

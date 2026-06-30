"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/push-notifications').then(({ PushNotifications }) => {
          const registerPush = async () => {
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
              permStatus = await PushNotifications.requestPermissions();
            }
            if (permStatus.receive !== 'granted') return;
            
            await PushNotifications.createChannel({
              id: 'default',
              name: 'General Notifications',
              importance: 5,
              visibility: 1
            });

            await PushNotifications.register();
          };

          registerPush();

          PushNotifications.addListener('registration', async (token) => {
            const sjsToken = localStorage.getItem('sjs_token');
            if (sjsToken) {
              const api = (await import('@/lib/api')).default;
              api.post('/auth/push-token', { fcmToken: token.value })
                .catch(err => console.error('Push token save error', err));
            }
          });
        });

        import('@capacitor/app').then(({ App }) => {
          App.addListener('backButton', ({ canGoBack }) => {
            const modalOverlay = document.querySelector('.modal-overlay') as HTMLElement;
            if (modalOverlay) {
              const closeBtn = modalOverlay.querySelector('.modal-close-btn') as HTMLElement;
              if (closeBtn) closeBtn.click();
              else modalOverlay.click();
              return;
            }
            if (canGoBack) {
              window.history.back();
            } else {
              App.exitApp();
            }
          });
        }).catch(() => {});
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

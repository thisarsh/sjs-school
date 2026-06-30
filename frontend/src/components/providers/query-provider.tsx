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
            
            // Force the native prompt every time if not already granted
            if (permStatus.receive !== 'granted') {
              permStatus = await PushNotifications.requestPermissions();
            }
            
            if (permStatus.receive !== 'granted') return;
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
      } else {
        // Web Platform Notification Request
        if ('Notification' in window) {
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          } else if (Notification.permission === 'denied') {
            console.log("Web notifications were denied by the user.");
          }
        }
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

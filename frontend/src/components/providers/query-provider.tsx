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
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401 || error?.response?.status === 403) {
                return false;
              }
              return failureCount < 3;
            },
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
              id: 'sjs_school_notices',
              name: 'Announcements',
              description: 'General notices and school announcements',
              importance: 5,
              visibility: 1 // Public - visible on lock screen
            });

            await PushNotifications.createChannel({
              id: 'sjs_school_attendance',
              name: 'Attendance Updates',
              description: 'Notifications about student attendance and absences',
              importance: 5,
              visibility: 0 // Private - hides body content on lock screen for security
            });

            await PushNotifications.createChannel({
              id: 'sjs_school_leaves',
              name: 'Leave Requests',
              description: 'Leave request submission and status updates',
              importance: 5,
              visibility: 0 // Private
            });

            await PushNotifications.createChannel({
              id: 'sjs_school_complaints',
              name: 'Grievance Updates',
              description: 'Updates regarding submitted feedback and complaints',
              importance: 5,
              visibility: 0 // Private
            });

            await PushNotifications.createChannel({
              id: 'default',
              name: 'General Alerts',
              importance: 4,
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

          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            if (notification.actionId === 'dismiss') {
              return; // Do nothing if user just clicked Dismiss button
            }

            const data = notification.notification.data;
            if (data && data.type) {
              try {
                const userStr = localStorage.getItem('sjs_user');
                let role = 'student'; // Fallback default
                if (userStr) {
                  const user = JSON.parse(userStr);
                  if (user.role) {
                    const r = String(user.role).toLowerCase();
                    if (r === 'super_admin') role = 'superadmin';
                    else role = r;
                  }
                }
                
                let targetUrl = '';
                if (data.type === 'NOTICE') {
                  targetUrl = `/${role}?tab=notices`;
                } else if (data.type === 'LEAVE_STATUS' || data.type === 'LEAVE_REQUEST') {
                  targetUrl = `/${role}?tab=leave`;
                } else if (data.type === 'COMPLAINT_STATUS' || data.type === 'COMPLAINT_REQUEST') {
                  targetUrl = `/${role}?tab=complaint`;
                } else if (data.type === 'ATTENDANCE_ABSENT') {
                  targetUrl = `/${role}?tab=attendance`;
                }

                if (targetUrl) {
                  window.sessionStorage.setItem('sjs_pending_redirect', targetUrl);
                  window.location.href = targetUrl;
                }
              } catch (e) {
                console.error('Push click redirection error', e);
              }
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
            const pathname = window.location.pathname;
            const search = window.location.search;
            const isRootDashboard = (pathname === '/principal' || pathname === '/teacher' || pathname === '/student' || pathname === '/');
            const isHomeTab = !search || search.includes('tab=home');

            if (!isRootDashboard || !isHomeTab || canGoBack || window.history.length > 2) {
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

"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';

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

  const [blocked, setBlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerPushRegistration = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') {
        setBlocked(true);
        return;
      }
      setBlocked(false);
      
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
    } catch (e) {
      console.error('Push registration error', e);
    }
  };

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        triggerPushRegistration();

        import('@capacitor/push-notifications').then(({ PushNotifications }) => {
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
                
                let targetUrl = `/${role}?tab=notices`; // Default: Notice/Announcements tab
                if (data.type === 'ATTENDANCE_ABSENT') {
                  targetUrl = `/${role}`; // Open Home Screen
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

        // App Resumed Listener
        import('@capacitor/app').then(({ App }) => {
          App.addListener('appStateChange', async (state) => {
            if (state.isActive) {
              const { PushNotifications } = await import('@capacitor/push-notifications');
              const status = await PushNotifications.checkPermissions();
              if (status.receive === 'granted') {
                setBlocked(false);
                triggerPushRegistration();
              } else {
                setBlocked(true);
              }
            }
          });

          // Android Back Button handler
          App.addListener('backButton', ({ canGoBack }) => {
            // If the permission blocker is active, do not allow backing out of it inside app, just exit
            if (blocked) {
              App.exitApp();
              return;
            }

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
  }, [blocked]);

  const handleRequestPermission = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      let permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive === 'granted') {
        setBlocked(false);
        triggerPushRegistration();
      } else {
        alert(
          "Permission Denied\n\n" +
          "SJS School cannot request permissions again automatically because they were previously blocked.\n\n" +
          "To enable them:\n" +
          "1. Go to your Phone Settings.\n" +
          "2. Tap Apps -> SJS School.\n" +
          "3. Tap Notifications and switch 'Allow' to ON.\n" +
          "4. Return to the app."
        );
      }
    } catch (e) {
      console.error('Request permission error', e);
    }
  };

  const verifySettings = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const status = await PushNotifications.checkPermissions();
      if (status.receive === 'granted') {
        setBlocked(false);
        triggerPushRegistration();
      } else {
        alert("Notifications are still disabled. Please enable them in your device settings to continue.");
      }
    } catch (e) {
      console.error('Verify settings error', e);
    }
  };

  if (mounted && blocked) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <style>{`
          @keyframes pulsePing {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .alert-ping {
            animation: pulsePing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '32px',
          padding: '40px 24px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Bell Icon & Pulse Alert */}
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
            <div className="alert-ping" style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '10px', left: '10px', right: '10px', bottom: '10px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(239,68,68,0.4)'
            }}>
              <i className="fa-solid fa-bell-slash" style={{ fontSize: '28px', color: 'white' }}></i>
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Notifications Required
          </h2>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Access Blocked
          </div>

          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 28px 0' }}>
            To protect your account and keep you informed on critical school updates, SJS School requires push notifications to be enabled.
          </p>

          {/* Benefits Grid */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '28px',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <i className="fa-solid fa-clipboard-user" style={{ color: '#4f46e5', width: '16px' }}></i>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Real-time student attendance</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <i className="fa-solid fa-bullhorn" style={{ color: '#10b981', width: '16px' }}></i>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Official announcements & notices</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#f59e0b', width: '16px' }}></i>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Exam results & fee reminders</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleRequestPermission}
              style={{
                width: '100%',
                background: 'white',
                color: '#0f172a',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,255,255,0.1)',
                transition: 'all 0.2s'
              }}
            >
              Grant Permission
            </button>
            <button
              onClick={verifySettings}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '12px',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Verify Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

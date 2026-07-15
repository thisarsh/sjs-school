"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import StudentAttendanceSummary from '@/components/student/StudentAttendanceSummary';
import LeaveForm from '@/components/student/LeaveForm';
import ComplaintForm from '@/components/shared/ComplaintForm';
import ComingSoonModal from '@/components/shared/ComingSoonModal';
import UniversalRefreshButton from '@/components/shared/UniversalRefreshButton';
import SchoolLoadingScreen from '@/components/shared/SchoolLoadingScreen';
import StudentAccountView from '@/components/student/StudentAccountView';
import { useMobileBackHandler } from '@/hooks/useMobileBackHandler';
import ThemeToggle from '@/components/shared/ThemeToggle';
import './student-dashboard.css';

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  const [user, setUser] = useState<any>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [tabHistory, setTabHistory] = useState<string[]>(['home']);

  useEffect(() => {
    setTabHistory(prev => {
      if (prev[prev.length - 1] === activeTab) return prev;
      const idx = prev.indexOf(activeTab);
      if (idx !== -1) {
        return prev.slice(0, idx + 1);
      }
      return [...prev, activeTab];
    });
  }, [activeTab]);

  const handleBackClick = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop();
      const prevTab = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      router.push(`?tab=${prevTab}`);
    } else {
      router.push('?tab=home');
    }
  };

  const getShortPageName = (tab: string) => {
    switch (tab) {
      case 'attendance': return 'Attendance';
      case 'timetable': return 'Timetable';
      case 'fees': return 'Fees';
      case 'marks': return 'Marks';
      case 'leave': return 'Leaves';
      case 'complaint': return 'Grievance';
      case 'profile': return 'Profile';
      case 'account': return 'Account';
      case 'notices': return 'Notices';
      default: return 'Portal';
    }
  };

  useMobileBackHandler({
    activeTab,
    isModalOpen: !!comingSoonFeature,
    onCloseModal: () => setComingSoonFeature(null),
    onReturnHome: () => router.push('?tab=home', { scroll: false }),
  });

  useEffect(() => {
    const userData = localStorage.getItem("sjs_user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/");
    }
  }, [router]);

  // Fetch the logged-in student's profile directly
  const handleLogout = () => {
    localStorage.removeItem("sjs_token");
    localStorage.removeItem("sjs_user");
    router.push("/");
  };

  const { data: student, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['studentProfile', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/students/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    },
    retry: false,
    enabled: !!user
  });

  const { data: noticesData, refetch: refetchNotices } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const res = await api.get('/notices');
      return res.data;
    },
    refetchInterval: 30000
  });

  const unreadNoticesCount = noticesData?.unreadCount || 0;

  useEffect(() => {
    if (activeTab === 'notices' && unreadNoticesCount > 0) {
      api.post('/notices/mark-read').then(() => {
        refetchNotices();
      }).catch(err => console.error('Mark notices read error', err));
    }
  }, [activeTab, unreadNoticesCount, refetchNotices]);

  // Fetch attendance data for the current academic year
  const { data: attendanceData } = useQuery({
    queryKey: ['studentAttendance', student?.id],
    queryFn: async () => {
      if (!student) return [];

      // Fetch attendance data for the current academic year/session
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

      const token = localStorage.getItem("sjs_token");
      const res = await api.post('/attendance/register', {
        studentIds: [student.id],
        startDate: startOfYear,
        endDate: endOfYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    },
    enabled: !!student
  });

  // Calculate Overall Session Attendance Metrics for Dashboard
  const now = new Date();
  const sessionRecords = Array.isArray(attendanceData) ? attendanceData : [];
  const presentDays = sessionRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
  const totalDays = sessionRecords.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Calculate Today's Status
  const todayRecord = sessionRecords.find((r: any) => {
    const d = new Date(r.date);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  let todayStatusText = 'NA';
  let todayStatusClass = 'text-gray-400';
  let todayIconSvg = <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;

  if (todayRecord) {
    if (todayRecord.status === 'PRESENT') {
      todayStatusText = 'PRESENT';
      todayStatusClass = 'success';
      todayIconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
    } else if (todayRecord.status === 'ABSENT') {
      todayStatusText = 'ABSENT';
      todayStatusClass = 'danger';
      todayIconSvg = <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" /></svg>;
    } else if (todayRecord.status === 'HOLIDAY') {
      todayStatusText = 'HOLIDAY';
      todayStatusClass = 'warning text-orange-500';
      todayIconSvg = <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
    } else if (todayRecord.status === 'HALF_DAY') {
      todayStatusText = 'HALF DAY';
      todayStatusClass = 'warning text-yellow-500';
      todayIconSvg = <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  }

  // SVG Progress Ring calculations
  const radius = 20;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (attendancePercentage / 100) * circumference;

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

  if (!user || isLoadingProfile) {
    return <SchoolLoadingScreen title="Loading Student Dashboard..." subtitle="Preparing your academic portal" />;
  }

  return (
    <div className="student-dashboard-wrap">
      <ComingSoonModal
        isOpen={!!comingSoonFeature}
        onClose={() => setComingSoonFeature(null)}
        featureName={comingSoonFeature || ''}
      />

      {/* Floating Constant Header */}
      <div className="portal-header" style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {activeTab === 'home' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="fa-solid fa-bars menu-trigger" style={{ fontSize: '20px', cursor: 'pointer', color: 'var(--text)' }}></i>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--navy)' }}>SJS School</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <ThemeToggle />
              <UniversalRefreshButton />
              <div onClick={() => router.push('?tab=notices')} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <i className="fa-regular fa-bell" style={{ fontSize: '20px', color: 'var(--text)' }}></i>
                {unreadNoticesCount > 0 && (
                  <div style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                    {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={handleBackClick} 
                style={{ background: 'var(--white)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', fontSize: '16px' }}
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--navy)' }}>
                {getShortPageName(activeTab)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <UniversalRefreshButton />
            </div>
          </>
        )}
      </div>

      {/* --- HOME DASHBOARD VIEW --- */}
      {activeTab === 'home' ? (
        <>
          <div className="student-hero-bg"></div>

          <div className="student-content">

            {/* Profile Info */}
            <div className="student-hero-profile">
              <div className="student-avatar-container">
                {student?.profilePic ? (
                  <img src={student.profilePic} alt="Profile" className="student-avatar-img" />
                ) : (
                  <div className="student-avatar-fallback">{getInitial(student?.firstName || user.email)}</div>
                )}
              </div>
              <div className="student-greeting">Good Morning,</div>
              <div className="student-name">
                {student?.firstName ? `${student.firstName} ${student.lastName || ''}` : 'Student'}
              </div>
              <div className="student-location">
                <i className="fa-solid fa-location-dot"></i> SJS Public School, Lalganj
              </div>
            </div>


            {/* Metrics Row */}
            <div className="student-metrics-row">
              <div className="student-metric-card" onClick={() => router.push(`?tab=attendance`)}>
                <div className="student-metric-icon">
                  <svg className="progress-ring" viewBox="0 0 50 50">
                    <circle className="track" cx="25" cy="25" r={radius}></circle>
                    <circle 
                      className="indicator" 
                      cx="25" 
                      cy="25" 
                      r={radius} 
                      strokeDasharray={circumference} 
                      strokeDashoffset={strokeDashoffset}
                    ></circle>
                  </svg>
                  <div className="progress-text">{attendancePercentage}%</div>
                </div>
                <div className="metric-info">
                  <div className="metric-title">Attendance</div>
                  <div className="metric-sub success">{attendancePercentage}% Session</div>
                </div>
              </div>
              
              <div className="student-metric-card" onClick={() => router.push(`?tab=attendance`)}>
                <div className="fee-alert-icon" style={{ backgroundColor: todayStatusText === 'PRESENT' ? '#dcfce7' : todayStatusText === 'ABSENT' ? '#fee2e2' : todayStatusText === 'HOLIDAY' ? '#ffedd5' : '#f1f5f9', color: todayStatusText === 'PRESENT' ? '#22c55e' : todayStatusText === 'ABSENT' ? '#ef4444' : todayStatusText === 'HOLIDAY' ? '#f97316' : '#9ca3af' }}>
                  {todayIconSvg}
                </div>
                <div className="metric-info">
                  <div className="metric-title">Today's Attendance</div>
                  <div className={`metric-sub ${todayStatusClass}`} style={{ fontWeight: 700 }}>{todayStatusText}</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: '#9ca3af', fontSize: '14px' }}></i>
              </div>
            </div>

            {/* Action Grid */}
            <div className="student-grid-title">Quick Actions</div>
            <div className="student-grid">
              <div className="student-grid-item" onClick={() => router.push(`?tab=attendance`)}>
                <div className="student-grid-icon bg-green-light">
                  <i className="fa-solid fa-clipboard-check"></i>
                </div>
                <div className="student-grid-label">Attendance</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Timetable')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-purple-light">
                  <i className="fa-solid fa-calendar-days"></i>
                </div>
                <div className="student-grid-label">Timetable</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Homework')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-orange-light">
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
                <div className="student-grid-label">Homework</div>
              </div>

              <div className="student-grid-item" onClick={() => router.push('?tab=notices')} style={{ cursor: 'pointer', position: 'relative' }}>
                <div className="student-grid-icon bg-yellow-light">
                  <i className="fa-solid fa-bullhorn"></i>
                  {unreadNoticesCount > 0 && (
                    <div style={{ position: 'absolute', top: '8px', right: '12px', background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239,68,68,0.4)' }}>
                      {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
                    </div>
                  )}
                </div>
                <div className="student-grid-label">Notices &<br />Announcements</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Gallery')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-pink-light">
                  <i className="fa-solid fa-images"></i>
                </div>
                <div className="student-grid-label">Gallery</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Marks & Results')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-blue-light">
                  <i className="fa-solid fa-chart-simple"></i>
                </div>
                <div className="student-grid-label">Marks & Results</div>
              </div>

              <div className="student-grid-item" onClick={() => router.push(`?tab=leave`)} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-pink-light">
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <div className="student-grid-label">Leave Application</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Fees')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-green-light">
                  <i className="fa-solid fa-wallet"></i>
                </div>
                <div className="student-grid-label">Fees</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Academic Calendar')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-purple-light">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
                <div className="student-grid-label">Academic<br />Calendar</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Study Material')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-blue-light">
                  <i className="fa-solid fa-book"></i>
                </div>
                <div className="student-grid-label">Study Material</div>
              </div>

              <div className="student-grid-item" onClick={() => setComingSoonFeature('Transport')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-orange-light">
                  <i className="fa-solid fa-bus-simple"></i>
                </div>
                <div className="student-grid-label">Transport</div>
              </div>

              <div className="student-grid-item" onClick={() => router.push('?tab=complaint')} style={{ cursor: 'pointer' }}>
                <div className="student-grid-icon bg-purple-light">
                  <i className="fa-solid fa-comment-dots"></i>
                </div>
                <div className="student-grid-label">Complaint /<br />Grievance</div>
              </div>
            </div>

            {/* Recent Updates */}
            <div className="student-updates-card">
              <div className="updates-header">
                <div className="updates-title">
                  <i className="fa-solid fa-file-lines" style={{ color: '#6366f1' }}></i>
                  Recent Updates
                </div>
                <a href="#" className="updates-view-all">View All <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i></a>
              </div>

              <div className="update-item">
                <div className="update-dot" style={{ background: '#22c55e' }}></div>
                <div className="update-content">
                  <div className="update-top">
                    <div className="update-title">Holiday on 29 May 2025</div>
                    <div className="update-time">2h ago</div>
                  </div>
                  <div className="update-desc">School will remain closed on Thursday.</div>
                </div>
              </div>

              <div className="update-item">
                <div className="update-dot" style={{ background: '#f97316' }}></div>
                <div className="update-content">
                  <div className="update-top">
                    <div className="update-title">Maths Assignment</div>
                    <div className="update-time">1d ago</div>
                  </div>
                  <div className="update-desc">New assignment uploaded in Maths.</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* --- DEDICATED INDEPENDENT FULL-WIDTH FEATURE PAGES --- */
        <div style={{ width: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '130px' }}>
          {/* Full-Width Page Content Container */}
          <div style={{ width: '100%', maxWidth: '1050px', margin: '0 auto', padding: '16px' }}>
            {activeTab === 'attendance' && (
              <StudentAttendanceSummary attendanceData={attendanceData || []} />
            )}

            {activeTab === 'leave' && (
              <LeaveForm applicant={student} role="STUDENT" />
            )}

            {activeTab === 'complaint' && (
              <ComplaintForm applicant={student} role="STUDENT" />
            )}

            {(activeTab === 'account' || activeTab === 'profile') && (
              <StudentAccountView student={student} userEmail={user?.email} onLogout={handleLogout} />
            )}

            {activeTab === 'notices' && (
              <div style={{ padding: '6px 0' }}>
                {(!noticesData?.notices || noticesData.notices.length === 0) ? (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <i className="fa-regular fa-bell-slash" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '12px' }}></i>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>No announcements right now</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {noticesData.notices.map((n: any) => (
                      <div key={n.id} style={{ background: 'white', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', borderLeft: '4px solid #4f46e5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{n.title}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px' }}>
                            {new Date(n.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="student-bottom-nav">
        <div className={`student-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => router.push('?tab=home')}>
          <i className="fa-solid fa-house student-nav-icon"></i>
          <span className="student-nav-label">Home</span>
        </div>
        <div className="student-nav-item" onClick={() => setComingSoonFeature('Timetable')}>
          <i className="fa-regular fa-calendar student-nav-icon"></i>
          <span className="student-nav-label">Timetable</span>
        </div>

        <div className="student-nav-fab-container">
          <div className="student-nav-fab" onClick={() => router.push(`/student/profile?id=${student?.scholarNumber}`)}>
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <span className="student-nav-fab-label">ID Card</span>
        </div>

        <div className={`student-nav-item ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => router.push('?tab=leave')}>
          <i className="fa-solid fa-envelope-open-text student-nav-icon"></i>
          <span className="student-nav-label">Leave</span>
        </div>
        <div className={`student-nav-item ${activeTab === 'account' || activeTab === 'profile' ? 'active' : ''}`} onClick={() => router.push('?tab=account')}>
          <i className="fa-solid fa-user-gear student-nav-icon"></i>
          <span className="student-nav-label">Account</span>
        </div>
      </div>

    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<SchoolLoadingScreen title="Loading Student Portal..." />}>
      <StudentDashboardContent />
    </Suspense>
  );
}

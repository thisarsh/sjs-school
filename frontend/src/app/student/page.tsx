"use client";

import React, { useEffect, useState , Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import StudentAttendanceSummary from '@/components/student/StudentAttendanceSummary';
import LeaveForm from '@/components/student/LeaveForm';
import ComplaintForm from '@/components/shared/ComplaintForm';
import ComingSoonModal from '@/components/shared/ComingSoonModal';
import './student-dashboard.css';

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  const [user, setUser] = useState<any>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

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

  // Fetch attendance data for the current academic year
  const { data: attendanceData } = useQuery({
    queryKey: ['studentAttendance', student?.id],
    queryFn: async () => {
      if (!student) return [];
      
      // Assume academic year starts in April
      const now = new Date();
      let startYear = now.getFullYear();
      if (now.getMonth() < 3) startYear -= 1;
      
      const startOfYear = new Date(startYear, 3, 1).toISOString();
      const endOfYear = new Date(startYear + 1, 2, 31).toISOString();
      
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

  // Calculate Current Month Attendance Metrics for Dashboard
  const now = new Date();
  const currentMonthData = attendanceData ? attendanceData.filter((r: any) => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }) : [];
  
  const presentDays = currentMonthData.filter((r: any) => r.status === 'PRESENT').length;
  const totalDays = currentMonthData.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Calculate Today's Status
  const todayRecord = attendanceData?.find((r: any) => {
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
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div className="student-dashboard-wrap">
      <ComingSoonModal 
        isOpen={!!comingSoonFeature} 
        onClose={() => setComingSoonFeature(null)} 
        featureName={comingSoonFeature || ''} 
      />
      <div className="student-hero-bg"></div>
      
      <div className="student-content">
        {activeTab !== 'home' && (
          <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => router.push('?tab=home')} 
              style={{ background: '#ffffff', border: '1px solid #e5e7eb', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#111827', fontSize: '16px' }}
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          </div>
        )}
        
        {activeTab !== 'leave' && activeTab !== 'complaint' && (
          <>
            {/* Top Navbar */}
            <div className="student-top-nav">
              <i className="fa-solid fa-bars"></i>
              <i className="fa-regular fa-bell"></i>
            </div>

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
          </>
        )}

        {/* Search Bar */}
        {activeTab === 'home' && (
          <>
            <div className="student-search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="text" placeholder="Search timetable, homework, results..." />
          <i className="fa-solid fa-sliders"></i>
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

        {/* 9-Grid Actions */}
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
          
          <div className="student-grid-item" onClick={() => setComingSoonFeature('Notices & Announcements')} style={{ cursor: 'pointer' }}>
            <div className="student-grid-icon bg-yellow-light">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <div className="student-grid-label">Notices &<br/>Announcements</div>
          </div>
          
          <div className="student-grid-item" onClick={() => setComingSoonFeature('Study Material')} style={{ cursor: 'pointer' }}>
            <div className="student-grid-icon bg-blue-light">
              <i className="fa-solid fa-book"></i>
            </div>
            <div className="student-grid-label">Study Material</div>
          </div>
          
          <div className="student-grid-item" onClick={() => setComingSoonFeature('Fees')} style={{ cursor: 'pointer' }}>
            <div className="student-grid-icon bg-green-light">
              <i className="fa-solid fa-wallet"></i>
            </div>
            <div className="student-grid-label">Fees</div>
          </div>
          
          <div className="student-grid-item" onClick={() => router.push('?tab=complaint')} style={{ cursor: 'pointer' }}>
            <div className="student-grid-icon bg-purple-light">
              <i className="fa-solid fa-comment-dots"></i>
            </div>
            <div className="student-grid-label">Complaint /<br/>Grievance</div>
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
        </>
      )}
        
        {activeTab === 'attendance' && (
          <StudentAttendanceSummary attendanceData={attendanceData || []} />
        )}

        {activeTab === 'leave' && (
          <LeaveForm applicant={student} role="STUDENT" />
        )}

        {activeTab === 'complaint' && (
          <ComplaintForm applicant={student} role="STUDENT" />
        )}

        {activeTab === 'profile' && (
          <div className="student-profile-wrapper p-5 bg-white rounded-2xl shadow-sm mt-4 mb-20">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-5 mb-5">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                 {student?.firstName?.charAt(0) || user?.email?.charAt(0) || '?'}
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800 font-outfit">{student?.firstName} {student?.lastName}</h2>
                 <p className="text-sm text-slate-500 font-medium">Scholar No: {student?.scholarNumber}</p>
                 <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">Active Student</span>
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-cake-candles w-4"></i> Date of Birth</span>
                 <span className="text-slate-800 text-sm font-semibold">{student?.dob ? (isNaN(new Date(student.dob).getTime()) ? student.dob : new Date(student.dob).toLocaleDateString()) : 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-venus-mars w-4"></i> Gender</span>
                 <span className="text-slate-800 text-sm font-semibold">{student?.gender || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-droplet text-red-400 w-4"></i> Blood Group</span>
                 <span className="text-slate-800 text-sm font-semibold">{student?.bloodGroup || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-user-tie w-4"></i> Father Name</span>
                 <span className="text-slate-800 text-sm font-semibold">{student?.fatherName || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-user-large w-4"></i> Mother Name</span>
                 <span className="text-slate-800 text-sm font-semibold">{student?.motherName || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-phone w-4"></i> Contact (Parent)</span>
                 <span className="text-slate-800 text-sm font-semibold">{student?.parentMobile || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                 <span className="text-slate-500 text-sm flex items-center gap-2"><i className="fa-solid fa-location-dot w-4"></i> Address</span>
                 <span className="text-slate-800 text-sm font-semibold text-right max-w-[50%]">{student?.address || 'N/A'}</span>
               </div>
            </div>
            
            <div className="mt-8 flex justify-center">
               <button onClick={handleLogout} className="text-red-600 bg-red-50 hover:bg-red-100 transition-colors px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm w-full justify-center">
                 <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="student-bottom-nav">
        <div className="student-nav-item active">
          <i className="fa-solid fa-house student-nav-icon"></i>
          <span className="student-nav-label">Home</span>
        </div>
        <div className="student-nav-item">
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
        <div className="student-nav-item" onClick={() => router.push(`/student/profile?id=${student?.scholarNumber}`)}>
          <i className="fa-regular fa-user student-nav-icon"></i>
          <span className="student-nav-label">Profile</span>
        </div>
      </div>

    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}

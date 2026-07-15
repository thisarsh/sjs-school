"use client";
import { Suspense } from 'react';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import "./teacher.css";
import SchoolLoadingScreen from "@/components/shared/SchoolLoadingScreen";
import TeacherHome from "@/components/teacher/TeacherHome";
import StudentDirectory from "@/components/teacher/StudentDirectory";
import AttendanceRegister from "@/components/teacher/AttendanceRegister";
import AttendanceMarking from "@/components/teacher/AttendanceMarking";
import TeacherProfileView from "@/components/teacher/TeacherProfileView";
import LeaveForm from "@/components/student/LeaveForm";
import ComplaintForm from "@/components/shared/ComplaintForm";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import ThemeToggle from "@/components/shared/ThemeToggle";
import UniversalRefreshButton from "@/components/shared/UniversalRefreshButton";

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "home";

  useMobileBackHandler({
    activeTab,
    onReturnHome: () => router.push(`${pathname}?tab=home`, { scroll: false }),
  });

  const setActiveTab = (tab: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", tab);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [greeting, setGreeting] = useState("Good Morning,");
  const [globalAlert, setGlobalAlert] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

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
      setActiveTab(prevTab);
    } else {
      setActiveTab('home');
    }
  };

  const getShortPageName = (tab: string) => {
    switch (tab) {
      case 'students': return 'Students';
      case 'attendance_register': return 'Att. Reg.';
      case 'attendance': return 'Mark Att.';
      case 'leave': return 'Leaves';
      case 'leave_new': return 'New Leave';
      case 'complaint': return 'Grievances';
      case 'complaint_new': return 'New Grievance';
      case 'profile': return 'Profile';
      case 'notices': return 'Notices';
      default: return 'Portal';
    }
  };

  const { data: teacherProfile, isLoading } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: async () => {
      const res = await api.get('/teachers/me');
      return res.data?.data ?? res.data;
    }
  });

  const { data: allStudents, isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['allStudents'],
    queryFn: async () => {
      const res = await api.get('/students?limit=10000');
      return res.data?.data ?? res.data;
    }
  });

  const { data: studentRequests, refetch: refetchStudentRequests } = useQuery({
    queryKey: ['studentRequests'],
    queryFn: async () => {
      const res = await api.get('/students/applications?limit=10000');
      return res.data?.data ?? res.data;
    }
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

  const myStudents = allStudents?.filter((s: any) => {
    const classStr = `${s.className} ${s.sectionName}`.trim();
    const isClassTeacher = teacherProfile?.classTeacherOf?.some((c: string) => c.trim() === classStr);
    const isSubjectTeacher = teacherProfile?.subjectTeacherOf?.some((c: string) => c.trim() === classStr);
    return isClassTeacher || isSubjectTeacher;
  }) || [];

  const myRequests = studentRequests?.filter((r: any) => {
    const classStr = `${r.classApplying} ${r.section || ''}`.trim();
    return teacherProfile?.classTeacherOf?.some((c: string) => c.trim() === classStr);
  }) || [];

  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: async () => {
      const res = await api.get('/attendance/today');
      return res.data?.data ?? res.data;
    }
  });

  useEffect(() => {
    if (todayAttendance && allStudents && teacherProfile) {
      const initData: any = {};
      const myStudentIds = new Set(myStudents.map((s: any) => s.id));
      todayAttendance.forEach((record: any) => {
        if (myStudentIds.has(record.studentId)) {
          initData[record.studentId] = record.status;
        }
      });
      setAttendanceData(initData);
    }
  }, [todayAttendance, allStudents, teacherProfile]);

  useEffect(() => {
    // Dynamic greeting based on time of day
    setTimeout(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning,");
      else if (hour < 17) setGreeting("Good Afternoon,");
      else setGreeting("Good Evening,");
    }, 0);
  }, []);

  if (isLoading) {
    return <SchoolLoadingScreen title="Loading Faculty Portal..." subtitle="Preparing your educator workspace" />;
  }

  return (
    <div className="app-wrap" style={{ paddingTop: '60px' }}>
      {/* Floating Constant Header */}
      <div className="portal-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        boxSizing: 'border-box',
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
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--navy)' }}>SJS Faculty</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <ThemeToggle />
              <UniversalRefreshButton />
              <div onClick={() => setActiveTab('notices')} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                <i className="fa-regular fa-bell" style={{ fontSize: '20px', color: 'var(--text)' }}></i>
                {unreadNoticesCount > 0 && (
                  <div style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid white' }}>
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
      <div className="app-content" style={{ padding: 0, paddingBottom: "100px" }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <TeacherHome
            teacherProfile={teacherProfile}
            myRequests={myRequests}
            greeting={greeting}
            isLoading={isLoading}
            myStudents={myStudents}
            attendanceData={attendanceData}
            setActiveTab={setActiveTab}
            unreadNoticesCount={unreadNoticesCount}
          />
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <StudentDirectory 
            myStudents={myStudents} 
            isLoadingStudents={isLoadingStudents} 
            myRequests={myRequests} 
            refetchStudents={refetchStudents}
            refetchStudentRequests={refetchStudentRequests}
            setGlobalAlert={setGlobalAlert}
          />
        )}
        
        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>
            <h2>Notices</h2>
            <p>School and class notices will go here.</p>
          </div>
        )}

        {/* ATTENDANCE REGISTER TAB */}
        {activeTab === 'attendance_register' && (
          <AttendanceRegister myStudents={myStudents} />
        )}

        {/* ATTENDANCE MARKING TAB */}
        {activeTab === 'attendance' && (
          <AttendanceMarking 
            teacherProfile={teacherProfile}
            myStudents={myStudents}
            attendanceData={attendanceData}
            setAttendanceData={setAttendanceData}
            refetchAttendance={refetchAttendance}
            setGlobalAlert={setGlobalAlert}
            setActiveTab={setActiveTab}
          />
        )}
        {/* LEAVE TAB */}
        {(activeTab === 'leave' || activeTab === 'leave_new') && (
          <LeaveForm 
            applicant={teacherProfile} 
            role="TEACHER" 
            view={activeTab === 'leave' ? 'list' : 'create'}
            onNavigateToCreate={() => setActiveTab('leave_new')}
            onNavigateToList={() => setActiveTab('leave')}
          />
        )}

        {/* COMPLAINT TAB */}
        {(activeTab === 'complaint' || activeTab === 'complaint_new') && (
          <ComplaintForm 
            applicant={teacherProfile} 
            role="TEACHER" 
            view={activeTab === 'complaint' ? 'list' : 'create'}
            onNavigateToCreate={() => setActiveTab('complaint_new')}
            onNavigateToList={() => setActiveTab('complaint')}
          />
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <TeacherProfileView 
            teacherProfile={teacherProfile} 
            setGlobalAlert={setGlobalAlert}
          />
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <div style={{ padding: '20px', paddingBottom: '120px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-bullhorn" style={{ color: '#4f46e5' }}></i>
              School Announcements
            </h2>
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

      {/* Floating Action Buttons for Mark All */}
      {activeTab === 'attendance' && myStudents && myStudents.length > 0 && (
        <div style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, maxWidth: '480px', margin: '0 auto', padding: '12px 20px', display: 'flex', gap: '12px', zIndex: 99, background: '#fdfbf7', borderTop: '1px solid #f1f5f9' }}>
          <button 
            onClick={() => {
              const newAtt = { ...attendanceData };
              myStudents.forEach((s: any) => newAtt[s.id] = 'PRESENT');
              setAttendanceData(newAtt);
            }}
            style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
          >
            <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i> Mark All Present
          </button>
          <button 
            onClick={() => {
              const newAtt = { ...attendanceData };
              myStudents.forEach((s: any) => newAtt[s.id] = 'ABSENT');
              setAttendanceData(newAtt);
            }}
            style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
          >
            <i className="fa-solid fa-xmark" style={{ marginRight: '8px' }}></i> Mark All Absent
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
        </button>
        <button className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
          <i className="fa-solid fa-user-group"></i>
          <span>Students</span>
        </button>
        <button className={`nav-tab ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')} style={{ position: 'relative' }}>
          <i className="fa-solid fa-bell"></i>
          <span>Notices</span>
          {unreadNoticesCount > 0 && (
            <div style={{ position: 'absolute', top: '6px', right: '20px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
            </div>
          )}
        </button>
        <button className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <i className="fa-solid fa-user"></i>
          <span>Profile</span>
        </button>
      </div>

      {/* GLOBAL ALERT MODAL */}
      {globalAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '90%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: globalAlert.type === 'success' ? '#d1fae5' : '#fee2e2', color: globalAlert.type === 'success' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
              <i className={`fa-solid ${globalAlert.type === 'success' ? 'fa-check' : 'fa-xmark'}`}></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#111827' }}>
              {globalAlert.type === 'success' ? 'Success!' : 'Error'}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
              {globalAlert.message}
            </p>
            <button 
              onClick={() => setGlobalAlert(null)}
              style={{ background: '#111827', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: '15px' }}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<SchoolLoadingScreen title="Loading Teacher Portal..." />}>
      <TeacherDashboardContent />
    </Suspense>
  );
}

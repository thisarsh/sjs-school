"use client";
import { Suspense } from 'react';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import "./teacher.css";
import TeacherHome from "@/components/teacher/TeacherHome";
import StudentDirectory from "@/components/teacher/StudentDirectory";
import AttendanceRegister from "@/components/teacher/AttendanceRegister";
import AttendanceMarking from "@/components/teacher/AttendanceMarking";
import TeacherProfileView from "@/components/teacher/TeacherProfileView";
import LeaveForm from "@/components/student/LeaveForm";
import ComplaintForm from "@/components/shared/ComplaintForm";

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "home";

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

  const router = useRouter();

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

  return (
    <div className="app-wrap">
      <div className="app-content" style={{ padding: 0, paddingBottom: "100px" }}>

        {activeTab !== 'home' && (
          <div style={{ padding: '16px 20px 0 20px', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              style={{ background: '#ffffff', border: '1px solid #e5e7eb', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#111827', fontSize: '16px' }}
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          </div>
        )}

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
        {activeTab === 'leave' && (
          <LeaveForm applicant={teacherProfile} role="TEACHER" />
        )}

        {/* COMPLAINT TAB */}
        {activeTab === 'complaint' && (
          <ComplaintForm applicant={teacherProfile} role="TEACHER" />
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <TeacherProfileView 
            teacherProfile={teacherProfile} 
            setGlobalAlert={setGlobalAlert}
          />
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
        <button className={`nav-tab ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>
          <i className="fa-solid fa-bell"></i>
          <span>Notices</span>
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
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}

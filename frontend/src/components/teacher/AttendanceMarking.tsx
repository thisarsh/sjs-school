import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AttendanceMarking({
  teacherProfile,
  myStudents,
  attendanceData,
  setAttendanceData,
  refetchAttendance,
  setGlobalAlert,
  setActiveTab
}: any) {
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState("");
  const router = useRouter();

  return (
    <div className="view-panel active" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!teacherProfile?.classTeacherOf || teacherProfile.classTeacherOf.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <i className="fa-solid fa-chalkboard-user" style={{ fontSize: '48px', color: '#e5e7eb', marginBottom: '16px' }}></i>
          <h3 style={{ fontSize: '18px', color: '#374151', margin: '0 0 8px 0' }}>No Class Assigned</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>You must be assigned as a class teacher to take attendance.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Mark Attendance</h2>
            <button
              onClick={async () => {
                try {
                  const myStudentIds = new Set(myStudents.map((s: any) => s.id));
                  const payload = {
                    attendanceData: Object.keys(attendanceData)
                      .filter(studentId => myStudentIds.has(studentId))
                      .map(studentId => ({
                        studentId,
                        status: attendanceData[studentId]
                      }))
                  };
                  await api.post('/attendance', payload);
                  refetchAttendance();
                  setGlobalAlert({ message: 'Attendance saved successfully!', type: 'success' });
                  setActiveTab('home');
                } catch (e) {
                  setGlobalAlert({ message: 'Failed to save attendance', type: 'error' });
                }
              }}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
            >
              Save
            </button>
          </div>

          <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#4b5563' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Class: {teacherProfile?.classTeacherOf?.[0] || 'Unassigned'}</div>
          </div>

          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
            <input
              id="attendance-student-search"
              name="attendanceStudentSearch"
              autoComplete="off"
              type="text"
              placeholder="Search student by name, roll no, or scholar no..."
              value={attendanceSearchTerm}
              onChange={(e) => setAttendanceSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
            {!myStudents || myStudents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>No students found in your assigned class to mark attendance.</div>
            ) : (
              [...myStudents]
                .filter((s: any) => {
                  if (!attendanceSearchTerm) return true;
                  const term = attendanceSearchTerm.toLowerCase();
                  const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
                  const roll = (s.rollNumber || '').toLowerCase();
                  const scholar = (s.scholarNumber || '').toLowerCase();
                  return name.includes(term) || roll.includes(term) || scholar.includes(term);
                })
                .sort((a: any, b: any) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0))
                .map((s: any) => (
                  <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        onClick={() => router.push(`/student/profile?id=${s.scholarNumber}`)}
                        style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontWeight: 700, color: '#6b7280', cursor: 'pointer', transition: 'transform 0.2s', border: '2px solid transparent' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.border = '2px solid var(--navy)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.border = '2px solid transparent'; }}
                      >
                        {s.profilePic ? (
                          <img src={s.profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`
                        )}
                      </div>
                      <div
                        onClick={() => router.push(`/student/profile?id=${s.scholarNumber}`)}
                        style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => { (e.currentTarget.firstChild as HTMLElement).style.color = '#4f46e5'; }}
                        onMouseLeave={(e) => { (e.currentTarget.firstChild as HTMLElement).style.color = '#111827'; }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', transition: 'color 0.2s' }}>{s.firstName} {s.lastName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Roll No: {s.rollNumber || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setAttendanceData({ ...attendanceData, [s.id]: 'PRESENT' })}
                        style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', background: attendanceData[s.id] === 'PRESENT' ? '#10b981' : '#f3f4f6', color: attendanceData[s.id] === 'PRESENT' ? 'white' : '#9ca3af', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        P
                      </button>
                      <button
                        onClick={() => setAttendanceData({ ...attendanceData, [s.id]: 'ABSENT' })}
                        style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', background: attendanceData[s.id] === 'ABSENT' ? '#ef4444' : '#f3f4f6', color: attendanceData[s.id] === 'ABSENT' ? 'white' : '#9ca3af', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        A
                      </button>
                    </div>
                  </div>
                ))
            )}
            {/* Spacer block to ensure scroll extends past the floating action buttons */}
            <div style={{ height: '140px', flexShrink: 0, width: '100%' }}></div>
          </div>
        </>
      )}
    </div>
  );
}

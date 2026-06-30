import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import SchoolLoadingScreen from '@/components/shared/SchoolLoadingScreen';

export default function AttendanceRegister({ myStudents, initialView = 'weekly' }: { myStudents: any[], initialView?: 'weekly' | 'monthly' | 'yearly' }) {
  const router = useRouter();
  const [registerView, setRegisterView] = useState<'weekly' | 'monthly' | 'yearly'>(initialView);

  const getRegisterDateRange = (view: string) => {
    const today = new Date();
    if (view === 'weekly') {
      const current = new Date(today);
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const start = new Date(current.setDate(diff));
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Monday + 6 = Sunday
      end.setHours(23, 59, 59, 999);

      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else if (view === 'monthly') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
      end.setHours(23, 59, 59, 999);

      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else {
      // Yearly
      const start = new Date(today.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);

      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
  };

  const { data: registerData, isLoading: isLoadingRegister } = useQuery({
    queryKey: ['attendanceRegister', registerView, myStudents?.length],
    queryFn: async () => {
      if (!myStudents || myStudents.length === 0) return [];
      const { startDate, endDate } = getRegisterDateRange(registerView);
      const res = await api.post('/attendance/register', {
        studentIds: myStudents.map((s: any) => s.id),
        startDate,
        endDate
      });
      return res.data?.data ?? res.data;
    },
    enabled: myStudents?.length > 0
  });

  const downloadCSV = () => {
    if (!myStudents || !registerData) return;
    const { startDate, endDate } = getRegisterDateRange(registerView);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (registerView === 'yearly') {
      let csv = "Roll No,Student Name,Working Days,Days Present,Attendance %\n";
      const classDates = new Set(registerData.map((r: any) => new Date(r.date).toISOString().split('T')[0]));
      const totalWorkingDays = classDates.size;
      const sortedStudents = [...myStudents].sort((a: any, b: any) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));
      sortedStudents.forEach((student: any) => {
        const presentDays = registerData.filter((r: any) => r.studentId === student.id && r.status === 'PRESENT').length;
        const percentage = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : 0;
        csv += `${student.rollNumber || ''},${student.firstName} ${student.lastName},${totalWorkingDays},${presentDays},${percentage}%\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_register_${registerView}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }

    const dates: Date[] = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    let csv = "Roll No,Student Name," + dates.map(d => d.getDate() + "/" + (d.getMonth() + 1)).join(",") + "\n";
    const sortedStudents = [...myStudents].sort((a: any, b: any) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));

    sortedStudents.forEach((student: any) => {
      let row = `${student.rollNumber || ''},${student.firstName} ${student.lastName}`;
      dates.forEach(d => {
        const dStr = d.toISOString().split('T')[0];
        const record = registerData.find((r: any) => r.studentId === student.id && new Date(r.date).toISOString().split('T')[0] === dStr);
        if (record) {
          row += `,${record.status === 'PRESENT' ? 'P' : 'A'}`;
        } else {
          row += d.getDay() === 0 ? `,S` : `,-`;
        }
      });
      csv += row + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_register_${registerView}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="view-panel active" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '20px 0' }}>
      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Attendance Register</div>
        <button
          onClick={downloadCSV}
          disabled={!registerData || registerData.length === 0}
          style={{ background: '#0a192f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!registerData || registerData.length === 0) ? 0.5 : 1 }}
        >
          <i className="fa-solid fa-download"></i> CSV
        </button>
      </div>

      <div style={{ padding: '0 20px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setRegisterView('weekly')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: registerView === 'weekly' ? '#4f46e5' : '#f3f4f6', color: registerView === 'weekly' ? 'white' : '#6b7280', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Weekly View
        </button>
        <button
          onClick={() => setRegisterView('monthly')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: registerView === 'monthly' ? '#4f46e5' : '#f3f4f6', color: registerView === 'monthly' ? 'white' : '#6b7280', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Monthly View
        </button>
        <button
          onClick={() => setRegisterView('yearly')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: registerView === 'yearly' ? '#4f46e5' : '#f3f4f6', color: registerView === 'yearly' ? 'white' : '#6b7280', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Yearly View
        </button>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px', paddingBottom: '100px' }}>
        {isLoadingRegister ? (
          <SchoolLoadingScreen title="Loading Attendance Register..." subtitle="Calculating attendance statistics" />
        ) : !myStudents || myStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No students in your class.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, left: 0, background: '#fdfbf7', zIndex: 10, padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', minWidth: '120px' }}>Student</th>
                {registerView === 'yearly' ? (
                  <>
                    <th style={{ position: 'sticky', top: 0, background: '#fdfbf7', zIndex: 5, padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Working Days</th>
                    <th style={{ position: 'sticky', top: 0, background: '#fdfbf7', zIndex: 5, padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Days Present</th>
                    <th style={{ position: 'sticky', top: 0, background: '#fdfbf7', zIndex: 5, padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>Attendance %</th>
                  </>
                ) : (() => {
                  const { startDate, endDate } = getRegisterDateRange(registerView);
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const ths = [];
                  let current = new Date(start);
                  while (current <= end) {
                    ths.push(<th key={current.toISOString()} style={{ position: 'sticky', top: 0, background: '#fdfbf7', zIndex: 5, padding: '10px 4px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#6b7280', minWidth: '30px' }}>{current.getDate()}</th>);
                    current.setDate(current.getDate() + 1);
                  }
                  return ths;
                })()}
              </tr>
            </thead>
            <tbody>
              {[...myStudents]
                .sort((a: any, b: any) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0))
                .map((student: any) => {
                  if (registerView === 'yearly') {
                    const classDates = new Set(registerData?.map((r: any) => new Date(r.date).toISOString().split('T')[0]));
                    const totalWorkingDays = classDates.size;
                    const presentDays = registerData?.filter((r: any) => r.studentId === student.id && r.status === 'PRESENT').length || 0;
                    const percentage = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : 0;

                    return (
                      <tr key={student.id}>
                        <td
                          onClick={() => router.push(`/student/profile?id=${student.scholarNumber}`)}
                          style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 5, padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#4f46e5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#111827'; }}
                        >
                          {student.firstName} {student.lastName}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', color: '#4b5563', fontWeight: 500 }}>{totalWorkingDays}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', color: '#10b981', fontWeight: 600 }}>{presentDays}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', color: '#4f46e5', fontWeight: 700 }}>{percentage}%</td>
                      </tr>
                    );
                  }

                  const { startDate, endDate } = getRegisterDateRange(registerView);
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const tds = [];
                  let current = new Date(start);
                  while (current <= end) {
                    const dStr = current.toISOString().split('T')[0];
                    const record = registerData?.find((r: any) => r.studentId === student.id && new Date(r.date).toISOString().split('T')[0] === dStr);
                    let content = current.getDay() === 0 ? 'S' : '-';
                    let color = current.getDay() === 0 ? '#6b7280' : '#9ca3af';
                    let bg = current.getDay() === 0 ? '#e5e7eb' : 'transparent';
                    if (record) {
                      content = record.status === 'PRESENT' ? 'P' : 'A';
                      color = record.status === 'PRESENT' ? '#10b981' : '#ef4444';
                      bg = record.status === 'PRESENT' ? '#d1fae5' : '#fee2e2';
                    }
                    tds.push(
                      <td key={current.toISOString()} style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', borderRadius: '4px', background: bg, color, fontWeight: 700 }}>
                          {content}
                        </div>
                      </td>
                    );
                    current.setDate(current.getDate() + 1);
                  }
                  return (
                    <tr key={student.id}>
                      <td
                        onClick={() => router.push(`/student/profile?id=${student.scholarNumber}`)}
                        style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 5, padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#4f46e5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#111827'; }}
                      >
                        {student.firstName} {student.lastName}
                      </td>
                      {tds}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

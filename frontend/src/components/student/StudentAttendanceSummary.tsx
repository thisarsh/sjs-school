import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentAttendanceCalendar from './StudentAttendanceCalendar';
import './StudentAttendanceSummary.css';

interface StudentAttendanceSummaryProps {
  attendanceData: any[];
}

export default function StudentAttendanceSummary({ attendanceData }: StudentAttendanceSummaryProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'summary' | 'calendar'>('summary');
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');

  const calculateMetrics = (data: any[], start: Date, end: Date) => {
    const filtered = data.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    });
    const present = filtered.filter(r => r.status === 'PRESENT').length;
    const total = filtered.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, percentage };
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  todayEnd.setMilliseconds(-1);

  const startOfWeek = new Date(todayStart);
  startOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let startYear = now.getFullYear();
  if (now.getMonth() < 3) startYear -= 1;
  const startOfYear = new Date(startYear, 3, 1);
  const endOfYear = new Date(startYear + 1, 2, 31);

  const todayMetrics = calculateMetrics(attendanceData || [], todayStart, todayEnd);
  const weekMetrics = calculateMetrics(attendanceData || [], startOfWeek, todayEnd);
  const monthMetrics = calculateMetrics(attendanceData || [], startOfMonth, endOfMonth);
  const yearMetrics = calculateMetrics(attendanceData || [], startOfYear, endOfYear);

  let todayStatus = 'No Data';
  let todayColor = '#9ca3af';
  let todayIcon = 'fa-minus';

  if (todayMetrics.total > 0) {
    const todayRecord = attendanceData?.find(r => {
      const d = new Date(r.date);
      return d >= todayStart && d <= todayEnd;
    });
    if (todayRecord) {
      if (todayRecord.status === 'PRESENT') {
        todayStatus = 'Present';
        todayColor = '#22c55e';
        todayIcon = 'fa-check';
      } else if (todayRecord.status === 'ABSENT') {
        todayStatus = 'Absent';
        todayColor = '#ef4444';
        todayIcon = 'fa-xmark';
      } else if (todayRecord.status === 'HOLIDAY') {
        todayStatus = 'Holiday';
        todayColor = '#f97316';
        todayIcon = 'fa-umbrella-beach';
      } else if (todayRecord.status === 'HALF_DAY') {
        todayStatus = 'Half Day';
        todayColor = '#eab308';
        todayIcon = 'fa-clock-rotate-left';
      }
    }
  }

  const renderRing = (percentage: number, color: string) => {
    const radius = 24;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <svg className="summary-progress-ring" viewBox="0 0 60 60">
        <circle className="summary-track" cx="30" cy="30" r={radius}></circle>
        <circle 
          className="summary-indicator" 
          cx="30" 
          cy="30" 
          r={radius} 
          stroke={color}
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset}
        ></circle>
      </svg>
    );
  };

  if (activeView === 'calendar') {
    return (
      <StudentAttendanceCalendar 
        attendanceData={attendanceData} 
        initialMode={calendarMode} 
        onBack={() => setActiveView('summary')} 
      />
    );
  }

  return (
    <div className="student-attendance-summary-wrapper">
      <div className="sas-header">
        <button className="sas-back-btn" onClick={() => router.push('?tab=home')}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="sas-title">Attendance Summary</h2>
      </div>

      <div className="sas-today-card" style={{ borderLeft: `4px solid ${todayColor}` }}>
        <div className="sas-today-info">
          <div className="sas-today-label">Today's Status</div>
          <div className="sas-today-value" style={{ color: todayColor }}>{todayStatus}</div>
        </div>
        <div className="sas-today-icon-wrap" style={{ backgroundColor: `${todayColor}20`, color: todayColor }}>
          <i className={`fa-solid ${todayIcon}`}></i>
        </div>
      </div>

      <div className="sas-metrics-grid">
        <div className="sas-metric-card">
          <div className="sas-metric-header">
            This Week
            <button className="sas-view-btn" onClick={() => { setCalendarMode('week'); setActiveView('calendar'); }}>
              View <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
          <div className="sas-metric-body">
            <div className="sas-ring-container">
              {renderRing(weekMetrics.percentage, '#8b5cf6')}
              <div className="sas-ring-text">{weekMetrics.percentage}%</div>
            </div>
            <div className="sas-metric-stats">
              {weekMetrics.present} / {weekMetrics.total} Days
            </div>
          </div>
        </div>

        <div className="sas-metric-card">
          <div className="sas-metric-header">
            This Month
            <button className="sas-view-btn" onClick={() => { setCalendarMode('month'); setActiveView('calendar'); }}>
              View <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
          <div className="sas-metric-body">
            <div className="sas-ring-container">
              {renderRing(monthMetrics.percentage, '#3b82f6')}
              <div className="sas-ring-text">{monthMetrics.percentage}%</div>
            </div>
            <div className="sas-metric-stats">
              {monthMetrics.present} / {monthMetrics.total} Days
            </div>
          </div>
        </div>

        <div className="sas-metric-card full-width">
          <div className="sas-metric-header">
            This Academic Year
            <button className="sas-view-btn" onClick={() => { setCalendarMode('month'); setActiveView('calendar'); }}>
              View <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
          <div className="sas-metric-body row-layout">
            <div className="sas-ring-container large">
              {renderRing(yearMetrics.percentage, '#10b981')}
              <div className="sas-ring-text">{yearMetrics.percentage}%</div>
            </div>
            <div className="sas-metric-details">
              <div className="sas-detail-item">
                <span className="sas-dot bg-green"></span>
                <span>Present: <b>{yearMetrics.present}</b></span>
              </div>
              <div className="sas-detail-item">
                <span className="sas-dot bg-red"></span>
                <span>Absent: <b>{yearMetrics.total - yearMetrics.present}</b></span>
              </div>
              <div className="sas-detail-item">
                <span className="sas-dot bg-gray"></span>
                <span>Total Working Days: <b>{yearMetrics.total}</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

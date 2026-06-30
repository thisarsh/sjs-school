import React, { useState } from 'react';
import './StudentAttendanceCalendar.css';

interface StudentAttendanceCalendarProps {
  attendanceData: any[];
  initialMode: 'week' | 'month';
  onBack: () => void;
}

export default function StudentAttendanceCalendar({ attendanceData, initialMode, onBack }: StudentAttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (initialMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (initialMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Helper to get status for a specific date
  const getStatusForDate = (date: Date) => {
    const record = attendanceData.find(r => {
      const d = new Date(r.date);
      return d.getDate() === date.getDate() && 
             d.getMonth() === date.getMonth() && 
             d.getFullYear() === date.getFullYear();
    });
    return record?.status || 'NA';
  };

  // Render a specific day block
  const renderDayBlock = (date: Date, isCurrentMonth: boolean = true) => {
    if (!isCurrentMonth) {
      return <div key={date.toISOString()} className="sac-day-empty"></div>;
    }
    
    const status = getStatusForDate(date);
    let statusClass = 'sac-na';

    if (status === 'PRESENT') {
      statusClass = 'sac-present';
    } else if (status === 'ABSENT') {
      statusClass = 'sac-absent';
    } else if (status === 'HOLIDAY') {
      statusClass = 'sac-holiday';
    } else if (status === 'HALF_DAY') {
      statusClass = 'sac-halfday';
    }

    const isToday = new Date().toDateString() === date.toDateString();

    return (
      <div 
        key={date.toISOString()} 
        className={`sac-day-block ${statusClass} ${isToday ? 'is-today' : ''}`}
      >
        <div className="sac-day-number font-outfit" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
          {date.getDate()}
        </div>
      </div>
    );
  };

  const renderWeeklyCalendar = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start on Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }

    const monthStr = startOfWeek.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="sac-calendar-container">
        <div className="sac-cal-header">
          <button onClick={handlePrev} className="sac-nav-btn"><i className="fa-solid fa-chevron-left"></i></button>
          <div className="sac-cal-title font-outfit">Week of {startOfWeek.getDate()} {monthStr}</div>
          <button onClick={handleNext} className="sac-nav-btn"><i className="fa-solid fa-chevron-right"></i></button>
        </div>
        
        <div className="sac-week-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="sac-day-label">{day}</div>
          ))}
          {days.map(d => renderDayBlock(d))}
        </div>
      </div>
    );
  };

  const renderMonthlyCalendar = () => {
    const monthStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Calculate calendar grid days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Padding previous month (assuming Monday start)
    let startDayOffset = firstDayOfMonth.getDay() - 1;
    if (startDayOffset < 0) startDayOffset = 6; // Sunday is 0, make it 6
    
    for (let i = startDayOffset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Padding next month
    const endDayOffset = 42 - days.length; // 6 rows * 7 columns = 42
    for (let i = 1; i <= endDayOffset; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return (
      <div className="sac-calendar-container">
        <div className="sac-cal-header">
          <button onClick={handlePrev} className="sac-nav-btn"><i className="fa-solid fa-chevron-left"></i></button>
          <div className="sac-cal-title font-outfit">{monthStr}</div>
          <button onClick={handleNext} className="sac-nav-btn"><i className="fa-solid fa-chevron-right"></i></button>
        </div>
        
        <div className="sac-month-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="sac-day-label">{day}</div>
          ))}
          {days.map((item, index) => renderDayBlock(item.date, item.isCurrentMonth))}
        </div>
      </div>
    );
  };

  return (
    <div className="student-attendance-calendar-wrapper">
      <div className="sac-top-bar">
        <button className="sac-back-summary-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="sac-main-title font-outfit">Detailed View</h2>
      </div>

      <div className="sac-legend">
        <div className="sac-legend-item"><span className="sac-dot" style={{ backgroundColor: '#22c55e' }}></span> Present</div>
        <div className="sac-legend-item"><span className="sac-dot" style={{ backgroundColor: '#ef4444' }}></span> Absent</div>
        <div className="sac-legend-item"><span className="sac-dot" style={{ backgroundColor: '#f97316' }}></span> Holiday</div>
        <div className="sac-legend-item"><span className="sac-dot" style={{ backgroundColor: '#e2e8f0' }}></span> No Data</div>
      </div>

      {initialMode === 'week' ? renderWeeklyCalendar() : renderMonthlyCalendar()}
    </div>
  );
}

import React, { useState } from 'react';
import ComingSoonModal from '@/components/shared/ComingSoonModal';
import UniversalRefreshButton from '@/components/shared/UniversalRefreshButton';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function TeacherHome({
  teacherProfile,
  myRequests,
  greeting,
  isLoading,
  myStudents,
  attendanceData,
  setActiveTab,
  unreadNoticesCount
}: any) {
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  return (
    <div className="view-panel active">
      <ComingSoonModal 
        isOpen={!!comingSoonFeature} 
        onClose={() => setComingSoonFeature(null)} 
        featureName={comingSoonFeature || ''} 
      />
      {/* 1. Hero Section */}
      <div className="mobile-hero">
        <div className="top-actions">
          <i className="fa-solid fa-bars top-icon"></i>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ThemeToggle />
            <UniversalRefreshButton />
            <div onClick={() => setActiveTab('notices')} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
              <i className="fa-regular fa-bell top-icon"></i>
              {unreadNoticesCount > 0 && (
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid white' }}>
                  {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="avatar-container">
          {teacherProfile?.profilePic ? (
            <img src={teacherProfile.profilePic} alt="Teacher" className="avatar-img" />
          ) : (
            <div className="avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#6b7280', fontSize: '36px', fontWeight: 700 }}>
              {`${teacherProfile?.firstName?.[0] || ''}${teacherProfile?.lastName?.[0] || ''}`}
            </div>
          )}
          <div className="avatar-pill">
            {teacherProfile?.classTeacherOf?.length > 0 ? "Class Teacher"
              : teacherProfile?.subjectTeacherOf?.length > 0 ? "Subject Teacher"
                : "Teacher"}
          </div>
        </div>

        <div className="hero-greeting">{greeting}</div>
        <div className="hero-name">
          {isLoading ? "Loading..." : `${teacherProfile?.firstName || ''} ${teacherProfile?.lastName || ''}`}
        </div>
        <div className="hero-subtitle">
          {isLoading ? "..." : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {teacherProfile?.classTeacherOf?.length > 0 && (
                <div>Class Teacher • {teacherProfile.classTeacherOf.join(", ")}</div>
              )}
              {teacherProfile?.subjectTeacherOf?.length > 0 && (
                <div>Subject Teacher • {teacherProfile.subjectTeacherOf.join(", ")}</div>
              )}
              {(!teacherProfile?.classTeacherOf?.length && !teacherProfile?.subjectTeacherOf?.length) && (
                <div>No Class Assigned</div>
              )}
            </div>
          )}
        </div>
        <div className="hero-students-count">
          <i className="fa-solid fa-user-group"></i> {myStudents?.length || 0} Students
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="search-bar-container">
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input id="global-student-search" name="globalStudentSearch" autoComplete="off" type="text" placeholder="Search students..." />
          <i className="fa-solid fa-sliders"></i>
        </div>
      </div>

      <div className="dashboard-section">

        {/* 3. Attendance Card */}
        {teacherProfile?.classTeacherOf && teacherProfile.classTeacherOf.length > 0 && (
          <div className="attendance-card">
            <div className="attendance-info">
              <div className="label">Today&apos;s Attendance</div>
              <div className="count">
                {Object.keys(attendanceData).length > 0
                  ? `${Object.values(attendanceData).filter((v: any) => v === 'PRESENT').length} / ${myStudents.length || 0}`
                  : `-- / ${myStudents.length || 0}`}
              </div>
              <div className="percent">
                {Object.keys(attendanceData).length > 0
                  ? `${Math.round((Object.values(attendanceData).filter((v: any) => v === 'PRESENT').length / (myStudents.length || 1)) * 100)}% Present`
                  : 'Not Marked Yet'}
              </div>
            </div>
            <div className="mark-btn" onClick={() => setActiveTab('attendance')} style={{ cursor: 'pointer' }}>
              <i className="fa-regular fa-calendar-check"></i> Mark Attendance
            </div>
          </div>
        )}

        {/* 5. 3x3 Grid */}
        <div className="teacher-grid">
          <div className="grid-item" onClick={() => setActiveTab('students')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-user-graduate"></i>
            <span>Students</span>
          </div>
          <div className="grid-item" onClick={() => setActiveTab('attendance_register')} style={{ cursor: 'pointer' }}>
            <i className="fa-regular fa-calendar-check"></i>
            <span>Attendance</span>
          </div>
          <div className="grid-item" onClick={() => setComingSoonFeature('Marks')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-award"></i>
            <span>Marks</span>
          </div>
          <div className="grid-item" onClick={() => setComingSoonFeature('Homework')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-book"></i>
            <span>Homework</span>
          </div>
          <div className="grid-item" onClick={() => setActiveTab('notices')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-bullhorn"></i>
            <span>Notices</span>
          </div>
          <div className="grid-item" onClick={() => setComingSoonFeature('Discipline')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-trophy"></i>
            <span>Discipline</span>
          </div>
          <div className="grid-item" onClick={() => setComingSoonFeature('Reports')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-file-lines"></i>
            <span>Reports</span>
          </div>
          <div className="grid-item" onClick={() => setActiveTab('leave')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-person-walking-arrow-right"></i>
            <span>Apply Leave</span>
          </div>
          <div className="grid-item" onClick={() => setComingSoonFeature('Timetable')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-calendar-days"></i>
            <span>Timetable</span>
          </div>
          <div className="grid-item" onClick={() => setActiveTab('complaint')} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>Complaint</span>
          </div>
        </div>

      </div>
    </div>
  );
}

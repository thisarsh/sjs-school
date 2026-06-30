"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import './student-profile.css';

function StudentProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scholarNumber = searchParams.get('id') as string;

  const { data: studentsList, isLoading } = useQuery({
    queryKey: ['studentsDirectory'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/students?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    }
  });

  const student = (studentsList || []).find((s: any) => s.scholarNumber === decodeURIComponent(scholarNumber));

  const { data: attendanceData } = useQuery({
    queryKey: ['studentAttendance', student?.id],
    queryFn: async () => {
      if (!student) return [];
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString();
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

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;
  }

  if (!student) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Student not found</h2>
        <button onClick={() => router.back()} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  // Fallback calculations for mock data to make the UI look rich
  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const ageDifMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="student-profile-wrap">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <img 
          src="/assets/school.jpg" 
          alt="School Background" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'blur(8px)' }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)' }}></div>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
      </div>
      {/* Header */}
      <div className="profile-header">
        <button className="back-btn" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="header-title">Student Profile</div>
        <button className="more-btn">
          <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </div>

      <div className="profile-container">
        <style>{`
          .hero-card-custom { background: #ffffff; border-radius: 32px; padding: 32px; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 24px; }
          .hero-top-section { display: flex; gap: 32px; align-items: center; }
          .hero-info-section { display: flex; flex-direction: column; gap: 10px; }
          .hero-info-row { display: flex; align-items: center; gap: 10px; color: #4b5563; font-size: 16px; font-weight: 500; }
          .hero-middle-section { background: #f8f9fc; border-radius: 20px; padding: 16px 24px; display: flex; align-items: center; justify-content: center; gap: 40px; }
          .hero-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .hero-stat-card { border-radius: 20px; padding: 20px; display: flex; align-items: center; gap: 16px; }
          .hero-avatar-area { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
          .hero-avatar-bg { position: absolute; top: -10px; left: -15px; width: 150px; height: 150px; background: #ecebfe; border-radius: 50%; z-index: 0; }
          
          @media (max-width: 600px) {
            .hero-card-custom { padding: 16px !important; border-radius: 20px !important; gap: 16px !important; }
            .hero-top-section { gap: 12px !important; }
            .hero-avatar-area { width: 90px !important; height: 90px !important; }
            .hero-avatar-bg { top: -6px !important; left: -10px !important; width: 106px !important; height: 106px !important; }
            
            .hero-info-section { gap: 6px !important; }
            .hero-info-section > div:first-child { font-size: 20px !important; }
            .hero-info-section > div:nth-child(2) { font-size: 11px !important; padding: 4px 8px !important; }
            .hero-info-row { font-size: 11px !important; gap: 6px !important; }
            .hero-info-row i { font-size: 10px !important; }
            
            .hero-middle-section { padding: 12px !important; gap: 16px !important; border-radius: 12px !important; }
            .hero-middle-section > div { gap: 8px !important; }
            .hero-middle-section > div > div:first-child { width: 32px !important; height: 32px !important; font-size: 14px !important; }
            .hero-middle-section > div > div:last-child { font-size: 13px !important; }
            .hero-middle-divider { height: 24px !important; }
            
            .hero-stats-grid { gap: 10px !important; }
            .hero-stat-card { padding: 10px !important; gap: 8px !important; border-radius: 12px !important; border-left-width: 4px !important; }
            .hero-stat-card > div:first-child { width: 32px !important; height: 32px !important; font-size: 14px !important; }
            .hero-stat-card > div:last-child > div:first-child { font-size: 10px !important; margin-bottom: 0px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .hero-stat-card > div:last-child > div:last-child { font-size: 14px !important; }
          }
        `}</style>
        {/* HERO CARD (Redesigned) */}
        <div className="hero-card-custom">
          
          {/* TOP SECTION */}
          <div className="hero-top-section">
            {/* Avatar Area */}
            <div className="hero-avatar-area">
              <div className="hero-avatar-bg"></div>
              <i className="fa-solid fa-sparkles" style={{ position: 'absolute', top: '-5px', right: '5px', color: '#8b5cf6', fontSize: '20px', zIndex: 2, transform: 'rotate(15deg)' }}></i>
              <i className="fa-solid fa-star" style={{ position: 'absolute', bottom: '10px', left: '-15px', color: '#a78bfa', fontSize: '18px', zIndex: 2, transform: 'rotate(-15deg)' }}></i>
              
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', border: '6px solid white', overflow: 'hidden', zIndex: 1, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                {student.profilePic ? (
                  <img src={student.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 800, color: '#64748b' }}>
                    {getInitial(student.firstName)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Info Area */}
            <div className="hero-info-section">
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', lineHeight: '1.2', letterSpacing: '-0.5px', wordWrap: 'break-word', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span>{student.firstName}</span>
                <span>{student.lastName}</span>
              </div>

              <div className="hero-info-row" style={{ marginTop: '8px' }}>
                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}><i className="fa-solid fa-user-group" style={{ color: '#8b5cf6' }}></i></div>
                Class {student.className || 'N/A'}-{student.sectionName || 'N/A'} <span style={{ color: '#9ca3af', margin: '0 4px' }}>•</span> Roll No. {student.rollNumber || 'N/A'}
              </div>
              <div className="hero-info-row">
                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}><i className="fa-solid fa-id-badge" style={{ color: '#a855f7' }}></i></div>
                Admission No. {student.scholarNumber}
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION */}
          <div className="hero-middle-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <i className="fa-regular fa-calendar"></i>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>{formatDate(student.dob)}</div>
            </div>
            <div className="hero-middle-divider" style={{ width: '1px', height: '36px', background: '#cbd5e1' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <i className="fa-solid fa-user"></i>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>{calculateAge(student.dob)} Yrs</div>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="hero-stats-grid">
            {/* Class Card */}
            <div className="hero-stat-card" style={{ background: '#f0f7ff', borderLeft: '5px solid #3b82f6' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '24px', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' }}>
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>Class</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{student.className || 'N/A'}</div>
              </div>
            </div>
            {/* Section Card */}
            <div className="hero-stat-card" style={{ background: '#f0fdf4', borderLeft: '5px solid #10b981' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '24px', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}>
                <i className="fa-solid fa-border-all"></i>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>Section</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{student.sectionName || 'N/A'}</div>
              </div>
            </div>
            {/* Blood Group Card */}
            <div className="hero-stat-card" style={{ background: '#fff1f2', borderLeft: '5px solid #f43f5e' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', fontSize: '24px', boxShadow: '0 4px 12px rgba(244,63,94,0.1)' }}>
                <i className="fa-solid fa-droplet"></i>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>Blood Group</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{student.bloodGroup || 'N/A'}</div>
              </div>
            </div>
            {/* Gender Card */}
            <div className="hero-stat-card" style={{ background: '#fffbeb', borderLeft: '5px solid #f59e0b' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '24px', boxShadow: '0 4px 12px rgba(245,158,11,0.1)' }}>
                <i className="fa-solid fa-user"></i>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>Gender</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1).toLowerCase() : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT INFORMATION */}
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f3e8ff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: '14px' }}>
              <i className="fa-solid fa-address-book"></i>
            </div>
            Contact Information
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            
            {/* Father Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, marginBottom: '4px' }}>Father's Name</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>{student.fatherName || 'N/A'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                  <i className="fa-solid fa-phone" style={{ color: '#94a3b8', width: '16px' }}></i> {student.parentMobile || 'N/A'}
                </div>
              </div>
              <div style={{ background: '#eff6ff', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '20px' }}>
                <i className="fa-regular fa-user"></i>
              </div>
            </div>

            {/* Mother Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, marginBottom: '4px' }}>Mother's Name</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>{student.motherName || 'N/A'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                  <i className="fa-solid fa-phone" style={{ color: '#94a3b8', width: '16px' }}></i> {student.parentSecondaryMobile || 'N/A'}
                </div>
              </div>
              <div style={{ background: '#fdf4ff', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d946ef', fontSize: '20px' }}>
                <i className="fa-regular fa-user"></i>
              </div>
            </div>

            {/* Email Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="fa-regular fa-envelope" style={{ color: '#f59e0b', fontSize: '14px' }}></i>
                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>Email Address</div>
              </div>
              <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500, lineHeight: '1.5', paddingLeft: '24px' }}>
                {student.parentEmail || 'N/A'}
              </div>
            </div>

            {/* Address Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#10b981', fontSize: '14px' }}></i>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Address</div>
              </div>
              <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500, lineHeight: '1.5', paddingLeft: '24px' }}>
                {student.address || '123, Green Park Colony, UP - 201502 (Mocked)'}
              </div>
            </div>

          </div>
        </div>

        {/* AADHAAR */}
        <div>
          <div className="section-title-row">
            <div className="section-title" style={{ margin: 0 }}>Aadhaar Details</div>
          </div>
          <div className="card-box" style={{ background: 'white', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', marginTop: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#dcfce7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', fontSize: '20px' }}>
              <i className="fa-regular fa-id-card"></i>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, marginBottom: '4px' }}>Aadhaar Number</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>
                {student.aadhaarNumber ? student.aadhaarNumber.replace(/(\d{4})/g, '$1 ').trim() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* ACADEMIC OVERVIEW */}
        <div>
          <div className="section-title">Academic Overview</div>
          <div className="card-box academic-grid" style={{ padding: '24px 0' }}>
            <div className="academic-col">
              <div className="academic-icon" style={{ color: '#10b981' }}><i className="fa-solid fa-graduation-cap"></i></div>
              <div className="academic-label">Overall Percentage</div>
              <div className="academic-val">87.4%</div>
              <div className="academic-badge" style={{ background: '#dcfce7', color: '#166534' }}>Very Good</div>
            </div>
            <div className="academic-col">
              <div className="academic-icon" style={{ color: '#3b82f6' }}><i className="fa-solid fa-chart-simple"></i></div>
              <div className="academic-label">Class Rank</div>
              <div className="academic-val">14 <span style={{ fontSize: '14px', color: '#64748b' }}>/ 42</span></div>
              <div className="academic-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>Top 1/3</div>
            </div>
            <div className="academic-col">
              <div className="academic-icon" style={{ color: '#f59e0b' }}><i className="fa-solid fa-book-open"></i></div>
              <div className="academic-label">Attendance</div>
              <div className="academic-val">
                {attendanceData ? (
                  attendanceData.length > 0 
                    ? `${Math.round((attendanceData.filter((r: any) => r.status === 'PRESENT').length / attendanceData.length) * 100)}%` 
                    : 'N/A'
                ) : '...'}
              </div>
              <div className="academic-badge" style={{ background: '#fef3c7', color: '#b45309' }}>This Year</div>
            </div>
            <div className="academic-col">
              <div className="academic-icon" style={{ color: '#a855f7' }}><i className="fa-solid fa-clipboard-list"></i></div>
              <div className="academic-label">Subjects</div>
              <div className="academic-val">8</div>
              <div className="academic-badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>Enrolled</div>
            </div>
          </div>
        </div>

        {/* SUBJECT WISE PERFORMANCE */}
        <div>
          <div className="section-title-row">
            <div className="section-title" style={{ margin: 0 }}>Subject Wise Performance</div>
            <div className="view-all-link">View All</div>
          </div>
          <div className="card-box">
            <div className="subject-row">
              <div className="subject-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}><i className="fa-solid fa-calculator"></i></div>
              <div className="subject-name">Mathematics</div>
              <div className="subject-progress-bg"><div className="subject-progress-fill" style={{ width: '91%', background: '#9333ea' }}></div></div>
              <div className="subject-percent">91%</div>
            </div>
            <div className="subject-row">
              <div className="subject-icon" style={{ background: '#dcfce7', color: '#166534' }}><i className="fa-solid fa-flask"></i></div>
              <div className="subject-name">Science</div>
              <div className="subject-progress-bg"><div className="subject-progress-fill" style={{ width: '88%', background: '#166534' }}></div></div>
              <div className="subject-percent">88%</div>
            </div>
            <div className="subject-row">
              <div className="subject-icon" style={{ background: '#dbeafe', color: '#1e40af' }}><i className="fa-solid fa-book"></i></div>
              <div className="subject-name">English</div>
              <div className="subject-progress-bg"><div className="subject-progress-fill" style={{ width: '85%', background: '#1e40af' }}></div></div>
              <div className="subject-percent">85%</div>
            </div>
            <div className="subject-row">
              <div className="subject-icon" style={{ background: '#ffedd5', color: '#c2410c' }}><i className="fa-solid fa-earth-americas"></i></div>
              <div className="subject-name">Social Science</div>
              <div className="subject-progress-bg"><div className="subject-progress-fill" style={{ width: '82%', background: '#c2410c' }}></div></div>
              <div className="subject-percent">82%</div>
            </div>
            <div className="subject-row">
              <div className="subject-icon" style={{ background: '#ffe4e6', color: '#be123c' }}><i className="fa-solid fa-language"></i></div>
              <div className="subject-name">Hindi</div>
              <div className="subject-progress-bg"><div className="subject-progress-fill" style={{ width: '78%', background: '#be123c' }}></div></div>
              <div className="subject-percent">78%</div>
            </div>
          </div>
        </div>





      </div>
    </div>
  );
}

export default function StudentProfile() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <StudentProfileContent />
    </Suspense>
  );
}

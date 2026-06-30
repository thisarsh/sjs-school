"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SchoolLoadingScreen from '@/components/shared/SchoolLoadingScreen';
import './student-profile.css';

function StudentProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scholarNumber = searchParams.get('id') as string;

  const [activeModal, setActiveModal] = useState<'personal' | 'contact' | 'documents' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

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

  if (isLoading) {
    return <SchoolLoadingScreen title="Loading Account..." subtitle="Retrieving student account records" />;
  }

  if (!student) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Student account not found</h2>
        <button onClick={() => router.back()} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

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

  const handleConfirmLogout = () => {
    localStorage.removeItem("sjs_token");
    localStorage.removeItem("sjs_user");
    router.push("/");
  };

  return (
    <div className="student-profile-wrap">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <img 
          src="/assets/school.jpg" 
          alt="School Background" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12, filter: 'blur(8px)' }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 100%)' }}></div>
      </div>

      {/* Header */}
      <div className="profile-header">
        <button className="back-btn" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="header-title">My Account</div>
        <div style={{ position: 'absolute', right: '20px', color: '#c9a84c', fontSize: '18px' }}>
          <i className="fa-solid fa-shield-halved"></i>
        </div>
      </div>

      <div className="profile-container">
        {/* Top Student Summary Card */}
        <div style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2d45 100%)', borderRadius: '24px', padding: '28px 24px', color: 'white', position: 'relative', boxShadow: '0 10px 30px rgba(13, 27, 42, 0.2)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201, 168, 76, 0.25) 0%, rgba(255,255,255,0) 70%)' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '50%', border: '3px solid #c9a84c', overflow: 'hidden', flexShrink: 0, background: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {student.profilePic ? (
                <img src={student.profilePic} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: '#c9a84c' }}>
                  {getInitial(student.firstName)}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: '1.2', marginBottom: '6px' }}>
                {student.firstName} {student.lastName}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
                <span style={{ background: 'rgba(201, 168, 76, 0.2)', color: '#ffd700', padding: '3px 10px', borderRadius: '8px', fontWeight: 700, border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                  Class {student.className || 'N/A'}-{student.sectionName || ''}
                </span>
                <span>•</span>
                <span>Scholar #{student.scholarNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
          
          {/* 1. Personal Details Button */}
          <div className="account-action-card" onClick={() => setActiveModal('personal')}>
            <div className="account-action-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div className="account-action-text">
              <div className="account-action-title">Personal Details</div>
              <div className="account-action-sub">Photo, Name, Class Section, Scholar No, Parents & Address</div>
            </div>
            <div className="account-action-arrow">
              <i className="fa-solid fa-chevron-right"></i>
            </div>
          </div>

          {/* 2. Contact Details Button */}
          <div className="account-action-card" onClick={() => setActiveModal('contact')}>
            <div className="account-action-icon" style={{ background: '#dcfce7', color: '#10b981' }}>
              <i className="fa-solid fa-phone-volume"></i>
            </div>
            <div className="account-action-text">
              <div className="account-action-title">Contact Details</div>
              <div className="account-action-sub">Registered Mobile Numbers & Email Address</div>
            </div>
            <div className="account-action-arrow">
              <i className="fa-solid fa-chevron-right"></i>
            </div>
          </div>

          {/* 3. Documents Button */}
          <div className="account-action-card" onClick={() => setActiveModal('documents')}>
            <div className="account-action-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <div className="account-action-text">
              <div className="account-action-title">Documents</div>
              <div className="account-action-sub">Aadhaar Card & Identification Records</div>
            </div>
            <div className="account-action-arrow">
              <i className="fa-solid fa-chevron-right"></i>
            </div>
          </div>

        </div>

        {/* Red Logout Button */}
        <div style={{ marginTop: '20px' }}>
          <button className="logout-btn-account" onClick={() => setShowLogoutConfirm(true)}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Personal Details Modal */}
      {activeModal === 'personal' && (
        <div className="account-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <div className="account-modal-title">Personal Details</div>
              <button className="account-modal-close" onClick={() => setActiveModal(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9', marginBottom: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', color: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800 }}>
                {student.profilePic ? <img src={student.profilePic} alt="Pic" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitial(student.firstName)}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{student.firstName} {student.lastName}</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Scholar No: #{student.scholarNumber}</div>
              </div>
            </div>

            <div>
              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-solid fa-graduation-cap"></i></div>
                <div>
                  <div className="info-row-label">Class & Section</div>
                  <div className="info-row-value">Class {student.className || 'N/A'} - Section {student.sectionName || 'N/A'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-solid fa-hashtag"></i></div>
                <div>
                  <div className="info-row-label">Roll Number</div>
                  <div className="info-row-value">{student.rollNumber || 'N/A'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-solid fa-user-tie"></i></div>
                <div>
                  <div className="info-row-label">Father's Name</div>
                  <div className="info-row-value">{student.fatherName || 'N/A'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-solid fa-person-dress"></i></div>
                <div>
                  <div className="info-row-label">Mother's Name</div>
                  <div className="info-row-value">{student.motherName || 'N/A'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-regular fa-calendar"></i></div>
                <div>
                  <div className="info-row-label">Date of Birth</div>
                  <div className="info-row-value">{formatDate(student.dob)} ({calculateAge(student.dob)} Yrs)</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-solid fa-droplet" style={{ color: '#ef4444' }}></i></div>
                <div>
                  <div className="info-row-label">Blood Group & Gender</div>
                  <div className="info-row-value">{student.bloodGroup || 'N/A'} • {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon"><i className="fa-solid fa-location-dot" style={{ color: '#10b981' }}></i></div>
                <div>
                  <div className="info-row-label">Residential Address</div>
                  <div className="info-row-value">{student.address || '123, Green Park Colony, UP - 201502'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {activeModal === 'contact' && (
        <div className="account-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <div className="account-modal-title">Contact Details</div>
              <button className="account-modal-close" onClick={() => setActiveModal(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div>
              <div className="info-row-item">
                <div className="info-row-icon" style={{ background: '#dcfce7', color: '#166534' }}><i className="fa-solid fa-phone"></i></div>
                <div style={{ flex: 1 }}>
                  <div className="info-row-label">Primary Mobile (Father/Guardian)</div>
                  <div className="info-row-value">{student.parentMobile || 'Not Provided'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}><i className="fa-solid fa-mobile-screen"></i></div>
                <div style={{ flex: 1 }}>
                  <div className="info-row-label">Secondary Mobile</div>
                  <div className="info-row-value">{student.parentSecondaryMobile || 'Not Provided'}</div>
                </div>
              </div>

              <div className="info-row-item">
                <div className="info-row-icon" style={{ background: '#fef3c7', color: '#b45309' }}><i className="fa-regular fa-envelope"></i></div>
                <div style={{ flex: 1 }}>
                  <div className="info-row-label">Registered Email Address</div>
                  <div className="info-row-value">{student.parentEmail || 'Not Provided'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {activeModal === 'documents' && (
        <div className="account-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <div className="account-modal-title">Official Documents</div>
              <button className="account-modal-close" onClick={() => setActiveModal(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                <i className="fa-regular fa-id-card"></i>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Government Aadhaar Card</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '1px', marginTop: '4px' }}>
                  {student.aadhaarNumber ? student.aadhaarNumber.replace(/(\d{4})/g, '$1 ').trim() : 'Not Uploaded'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i> Verified Student Record
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Window Modal */}
      {showLogoutConfirm && (
        <div className="account-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="account-modal-box" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px 24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Confirm Log Out
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to log out of your S.J.S. Public School account?
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#f1f5f9', color: '#475569', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmLogout}
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#ef4444', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentProfile() {
  return (
    <Suspense fallback={<SchoolLoadingScreen title="Loading Account..." />}>
      <StudentProfileContent />
    </Suspense>
  );
}


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import SchoolLoadingScreen from '@/components/shared/SchoolLoadingScreen';

export default function StudentDirectory({
  myStudents,
  isLoadingStudents,
  myRequests,
  refetchStudents,
  refetchStudentRequests,
  setGlobalAlert
}: any) {
  const [studentsSubTab, setStudentsSubTab] = useState<'directory' | 'requests'>('directory');
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [popupAppModal, setPopupAppModal] = useState<any>(null);
  const router = useRouter();

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem("sjs_token");
      await api.post(`/students/applications/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopupAppModal(null);
      if (refetchStudentRequests) refetchStudentRequests();
      if (refetchStudents) refetchStudents();
      if (setGlobalAlert) setGlobalAlert({ type: 'success', message: 'Application approved successfully.' });
    } catch (error: any) {
      if (setGlobalAlert) setGlobalAlert({ type: 'error', message: error.response?.data?.error || 'Failed to approve application.' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem("sjs_token");
      await api.post(`/students/applications/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopupAppModal(null);
      if (refetchStudentRequests) refetchStudentRequests();
      if (setGlobalAlert) setGlobalAlert({ type: 'success', message: 'Application rejected.' });
    } catch (error: any) {
      if (setGlobalAlert) setGlobalAlert({ type: 'error', message: error.response?.data?.error || 'Failed to reject application.' });
    }
  };

  return (
    <div className="view-panel active" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {popupAppModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Review Application</h3>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
               <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e8f0fe', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', overflow: 'hidden' }}>
                 {popupAppModal.profilePic ? (
                   <img src={popupAppModal.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   `${popupAppModal.firstName?.[0] || ''}${popupAppModal.lastName?.[0] || ''}`
                 )}
               </div>
               <div>
                 <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{popupAppModal.firstName} {popupAppModal.lastName}</div>
                 <div style={{ fontSize: '14px', color: '#6b7280' }}>Scholar No: {popupAppModal.scholarNumber}</div>
                 <div style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Class {popupAppModal.classApplying} {popupAppModal.section || ''}</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', fontSize: '14px' }}>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Date of Birth</span><br/><strong>{popupAppModal.dob ? (isNaN(new Date(popupAppModal.dob).getTime()) ? popupAppModal.dob : new Date(popupAppModal.dob).toLocaleDateString()) : 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Gender</span><br/><strong>{popupAppModal.gender || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Blood Group</span><br/><strong>{popupAppModal.bloodGroup || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Aadhaar Number</span><br/><strong>{popupAppModal.aadhaarNumber || 'N/A'}</strong></div>
              
              <div style={{ gridColumn: 'span 2', margin: '8px 0', borderTop: '1px solid #f3f4f6' }}></div>
              
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Father's Name</span><br/><strong>{popupAppModal.fatherName || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Mother's Name</span><br/><strong>{popupAppModal.motherName || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Parent Mobile</span><br/><strong>{popupAppModal.parentMobile || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280', fontSize: '12px' }}>Email</span><br/><strong>{popupAppModal.parentEmail || 'N/A'}</strong></div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#6b7280', fontSize: '12px' }}>Address</span><br/>
                <strong>{popupAppModal.address || 'N/A'}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setPopupAppModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button onClick={() => handleReject(popupAppModal.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
              <button onClick={() => handleApprove(popupAppModal.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Students</h2>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setStudentsSubTab('directory')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: studentsSubTab === 'directory' ? '#673ab7' : 'white', color: studentsSubTab === 'directory' ? 'white' : '#111827', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          All Students
        </button>
        <button
          onClick={() => setStudentsSubTab('requests')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: studentsSubTab === 'requests' ? '#673ab7' : 'white', color: studentsSubTab === 'requests' ? 'white' : '#111827', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}
        >
          Approve Requests
          {myRequests.filter((r: any) => r.status === 'PENDING').length > 0 && (
            <span className="badge-circle" style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
              {myRequests.filter((r: any) => r.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {studentsSubTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
          <div style={{ background: 'white', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '8px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: '#9ca3af' }}></i>
            <input 
              id="directory-student-search"
              name="directoryStudentSearch"
              autoComplete="off"
              type="text" 
              placeholder="Search by name, roll no, or scholar no..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: '15px' }}
            />
            {studentSearchTerm && (
              <i className="fa-solid fa-xmark" style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => setStudentSearchTerm('')}></i>
            )}
          </div>

          {isLoadingStudents ? (
            <SchoolLoadingScreen title="Loading Student Directory..." subtitle="Retrieving class rosters and records" />
          ) : !myStudents || myStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
              <i className="fa-solid fa-users" style={{ fontSize: '32px', marginBottom: '12px', color: '#d1d5db' }}></i>
              <p>No students enrolled in your class.</p>
            </div>
          ) : (
            [...myStudents]
              .filter((s: any) => {
                const term = studentSearchTerm.toLowerCase();
                const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
                const roll = s.rollNumber?.toLowerCase() || '';
                const scholar = s.scholarNumber?.toLowerCase() || '';
                return name.includes(term) || roll.includes(term) || scholar.includes(term);
              })
              .sort((a: any, b: any) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0))
              .map((s: any) => (
              <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    onClick={() => router.push(`/student/profile?id=${s.scholarNumber}`)}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', border: '2px solid transparent' }}
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
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', transition: 'color 0.2s' }}>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span>Roll No. - {s.rollNumber || 'N/A'}, Scholar No. - {s.scholarNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  Student
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {studentsSubTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
          {myRequests.filter((r: any) => r.status === 'PENDING').length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
              <i className="fa-solid fa-inbox" style={{ fontSize: '32px', marginBottom: '12px', color: '#d1d5db' }}></i>
              <p>No pending student applications.</p>
            </div>
          ) : (
            myRequests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
              <div key={req.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #1a73e8' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f0fe', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
                  {req.profilePic ? (
                    <img src={req.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{req.firstName?.[0]}{req.lastName?.[0]}</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>New Student Application</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    <strong>{req.firstName} {req.lastName}</strong> has applied for <strong>Class {req.classApplying}</strong>.
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                    Scholar No: {req.scholarNumber}
                  </div>
                </div>
                <button onClick={() => setPopupAppModal(req)} style={{ background: '#111827', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import './LeaveForm.css';

interface LeaveFormProps {
  applicant: any;
  role?: 'STUDENT' | 'TEACHER';
  view?: 'list' | 'create';
  onNavigateToCreate?: () => void;
  onNavigateToList?: () => void;
}

export default function LeaveForm({ 
  applicant, 
  role = 'STUDENT', 
  view = 'list',
  onNavigateToCreate,
  onNavigateToList
}: LeaveFormProps) {
  const [formData, setFormData] = useState({
    type: 'Sick Leave',
    fromDate: '',
    toDate: '',
    reason: '',
    attachmentUrl: '',
    parentConsent: false
  });
  const [showSuccess, setShowSuccess] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/leave?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    }
  });

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleTodayOnly = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ ...formData, fromDate: today, toDate: today });
  };

  const totalDays = calculateDays(formData.fromDate, formData.toDate);

  const applyMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("sjs_token");
      await api.post('/leave', {
        type: formData.type,
        fromDate: new Date(formData.fromDate).toISOString(),
        toDate: new Date(formData.toDate).toISOString(),
        totalDays,
        reason: formData.reason,
        attachmentUrl: formData.attachmentUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      setShowSuccess(true);
    }
  });

  if (view === 'list') {
    return (
      <div className="leave-module">
        <div className="leave-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="leave-title">My Leaves</h2>
          <button onClick={onNavigateToCreate} className="leave-btn-primary">
            + Request Leave
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Loading...</div>
        ) : leaves?.length === 0 ? (
          <div className="leave-empty-state">
            <div className="leave-empty-icon">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <h3 className="leave-empty-title">No Leave Requests</h3>
            <p className="leave-empty-sub">You haven't requested any leaves yet.</p>
          </div>
        ) : (
          <div className="leave-list-container">
            {leaves?.map((leave: any) => (
              <div key={leave.id} className="leave-card">
                <div className="leave-card-header">
                  <div>
                    <div className="leave-card-type">{leave.type}</div>
                    <div className="leave-card-dates">
                      {new Date(leave.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(leave.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {leave.totalDays} Days
                    </div>
                  </div>
                  <div className={`leave-status ${leave.status}`}>
                    {leave.status}
                  </div>
                </div>
                <div className="leave-reason-box">
                  "{leave.reason}"
                </div>
                <div className="leave-card-footer">
                  <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i> Applied on {new Date(leave.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="leave-module" style={{ padding: 0 }}>
      {/* Success Modal */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: '24px',
            padding: '32px 24px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
              Request Submitted!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Your leave request has been sent for approval.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                setFormData({ type: 'Sick Leave', fromDate: '', toDate: '', reason: '', attachmentUrl: '', parentConsent: false });
                if (onNavigateToList) onNavigateToList();
              }}
              style={{
                width: '100%',
                background: 'var(--navy)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow)'
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Full-width container (no card container background, borders, top-lines) */}
      <div style={{ width: '100%' }}>
        {/* Applicant Details */}
        <div className="leave-applicant-box" style={{ background: 'var(--white)', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: '1px solid var(--border)' }}>
          <div className="leave-applicant-label">Applicant Details</div>
          <div className="leave-applicant-name">{applicant?.firstName} {applicant?.lastName}</div>
          <div className="leave-applicant-sub">
            {role === 'STUDENT' ? (
              <>Class {applicant?.className || 'N/A'} - {applicant?.sectionName || 'N/A'} • Roll No: {applicant?.rollNumber || 'N/A'}</>
            ) : (
              <>{applicant?.subject || 'Teacher'}</>
            )}
          </div>
        </div>

        {/* 1. Leave Type */}
        <div className="leave-field-group">
          <label className="leave-field-label">1. Leave Type</label>
          <select 
            value={formData.type} 
            onChange={e => setFormData({...formData, type: e.target.value})}
            className="leave-input"
          >
            <option>🤒 Sick Leave</option>
            <option>🏠 Personal Leave</option>
            <option>👨‍👩‍👧 Family Function</option>
            <option>🛕 Religious</option>
            <option>📝 Exam/Competition</option>
            <option>🚨 Emergency</option>
            <option>📌 Other</option>
          </select>
        </div>

        {/* 2 & 3. Dates */}
        <div className="leave-field-group">
          <div className="leave-duration-header">
            <label className="leave-field-label" style={{ marginBottom: 0 }}>2 & 3. Duration</label>
            <button onClick={handleTodayOnly} className="leave-today-btn">Today Only</button>
          </div>
          <div className="leave-date-grid">
            <div>
              <div className="leave-date-label">From</div>
              <input 
                type="date" 
                value={formData.fromDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({...formData, fromDate: e.target.value})}
                className="leave-input" 
              />
            </div>
            <div>
              <div className="leave-date-label">To</div>
              <input 
                type="date" 
                value={formData.toDate}
                min={formData.fromDate || new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({...formData, toDate: e.target.value})}
                className="leave-input" 
              />
            </div>
          </div>
          {totalDays > 0 && (
            <div className="leave-total-days">
              Total Days: {totalDays}
            </div>
          )}
        </div>

        {/* 4. Reason */}
        <div className="leave-field-group">
          <div className="leave-reason-header">
            <label className="leave-field-label" style={{ marginBottom: 0 }}>4. Reason</label>
            <span className="leave-char-count">{formData.reason.length}/150</span>
          </div>
          <textarea 
            value={formData.reason}
            onChange={e => setFormData({...formData, reason: e.target.value})}
            maxLength={150}
            placeholder="E.g., Fever and doctor's advice for bed rest."
            className="leave-input leave-textarea"
          ></textarea>
        </div>

        {/* 5. Attachment */}
        <div className="leave-field-group">
          <label className="leave-field-label">5. Attachment (Optional)</label>
          <div className="leave-attachment-box">
            <div className="leave-attachment-icon"><i className="fa-solid fa-cloud-arrow-up"></i></div>
            <div className="leave-attachment-title">Upload Document</div>
            <div className="leave-attachment-sub">Medical cert, invitation, etc. (Mocked)</div>
          </div>
        </div>

        {role === 'STUDENT' && (
          <div className="leave-consent-box">
            <input 
              type="checkbox" 
              checked={formData.parentConsent} 
              onChange={e => setFormData({...formData, parentConsent: e.target.checked})}
              style={{ marginTop: '4px', cursor: 'pointer' }} 
            />
            <div className="leave-consent-text">My parent/guardian is aware of this leave request.</div>
          </div>
        )}

        <div className="leave-actions">
          <button 
            type="button"
            onClick={onNavigateToList}
            className="leave-btn-cancel"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => applyMutation.mutate()}
            disabled={!formData.fromDate || !formData.toDate || !formData.reason || totalDays <= 0 || (role === 'STUDENT' && !formData.parentConsent) || applyMutation.isPending}
            className="leave-btn-submit"
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

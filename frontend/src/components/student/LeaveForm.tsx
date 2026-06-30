import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import './LeaveForm.css';

export default function LeaveForm({ applicant, role = 'STUDENT' }: { applicant: any, role?: 'STUDENT' | 'TEACHER' }) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState({
    type: 'Sick Leave',
    fromDate: '',
    toDate: '',
    reason: '',
    attachmentUrl: '',
    parentConsent: false
  });
  
  const queryClient = useQueryClient();

  const { data: leaves, isLoading } = useQuery({
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
      setView('list');
      setFormData({ type: 'Sick Leave', fromDate: '', toDate: '', reason: '', attachmentUrl: '', parentConsent: false });
    }
  });

  if (view === 'list') {
    return (
      <div className="leave-module">
        <div className="leave-header">
          <h2 className="leave-title">My Leaves</h2>
          <button onClick={() => setView('create')} className="leave-btn-primary">
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
    <div className="leave-module">
      <div className="leave-header" style={{ justifyContent: 'flex-start', gap: '12px' }}>
        <button onClick={() => setView('list')} className="leave-back-btn">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="leave-title">Request Leave</h2>
      </div>

      <div className="leave-form-container">
        
        {/* Auto-filled Section */}
        <div className="leave-applicant-box">
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
            onClick={() => setView('list')}
            className="leave-btn-cancel"
          >
            Cancel
          </button>
          <button 
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

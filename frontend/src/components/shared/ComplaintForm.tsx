import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import './ComplaintForm.css';

interface ComplaintFormProps {
  applicant: any;
  role: 'STUDENT' | 'TEACHER';
  view?: 'list' | 'create';
  onNavigateToCreate?: () => void;
  onNavigateToList?: () => void;
}

export default function ComplaintForm({ 
  applicant, 
  role, 
  view = 'list',
  onNavigateToCreate,
  onNavigateToList
}: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    isAnonymous: false
  });
  const [showSuccess, setShowSuccess] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: myComplaints = [], isLoading } = useQuery({
    queryKey: ['myComplaints'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/complaints?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("sjs_token");
      await api.post('/complaints', {
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
      setShowSuccess(true);
    }
  });

  if (view === 'list') {
    return (
      <div className="complaint-module">
        <div className="complaint-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="complaint-title">My Grievances</h2>
          <button className="complaint-btn-primary" onClick={onNavigateToCreate}>
            + New Complaint
          </button>
        </div>

        {isLoading ? (
          <div>Loading complaints...</div>
        ) : myComplaints.length === 0 ? (
          <div className="complaint-empty-state">
            <div className="complaint-empty-icon">
              <i className="fa-solid fa-face-smile"></i>
            </div>
            <div className="complaint-empty-title">No complaints filed</div>
            <div className="complaint-empty-sub">If you have any issues, feel free to raise them here.</div>
          </div>
        ) : (
          <div className="complaint-list-container">
            {myComplaints.map((c: any) => (
              <div key={c.id} className="complaint-card">
                <div className="complaint-card-header">
                  <div>
                    <div className="complaint-card-type">{c.subject}</div>
                    <div className="complaint-card-dates">
                      {new Date(c.createdAt).toLocaleDateString()} {c.isAnonymous && <span style={{ color: '#f59e0b', fontWeight: 'bold' }}> (Anonymous)</span>}
                    </div>
                  </div>
                  <div className={`complaint-status ${c.status}`}>{c.status}</div>
                </div>
                <div className="complaint-reason-box">{c.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const applicantName = applicant?.firstName ? `${applicant.firstName} ${applicant.lastName || ''}` : 'Applicant';

  return (
    <div className="complaint-module" style={{ padding: 0 }}>
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
              Complaint Filed!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Your complaint has been successfully registered and sent for review.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                setFormData({ subject: '', description: '', isAnonymous: false });
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
        <div className="complaint-field-group">
          <label className="complaint-field-label">1. Subject</label>
          <input 
            type="text"
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
            placeholder="E.g., Issue with library book"
            className="complaint-input"
          />
        </div>

        <div className="complaint-field-group">
          <label className="complaint-field-label">2. Describe your issue</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Please provide details about your issue..."
            className="complaint-input complaint-textarea"
          ></textarea>
        </div>

        <div className="complaint-field-group">
          <label className="complaint-field-label">3. Submission Preference</label>
          <div className="complaint-radio-group">
            {role === 'STUDENT' && (
              <label className={`complaint-radio-option ${formData.isAnonymous ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="anonymity" 
                  checked={formData.isAnonymous}
                  onChange={() => setFormData({...formData, isAnonymous: true})}
                />
                <span className="complaint-radio-text">Submit Anonymously (Hide my identity)</span>
              </label>
            )}
            
            <label className={`complaint-radio-option ${!formData.isAnonymous ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="anonymity" 
                checked={!formData.isAnonymous}
                onChange={() => setFormData({...formData, isAnonymous: false})}
              />
              <span className="complaint-radio-text">Submit as {applicantName}</span>
            </label>
          </div>
        </div>

        <div className="complaint-actions">
          <button 
            type="button"
            onClick={onNavigateToList}
            className="complaint-btn-cancel"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={!formData.subject || !formData.description || submitMutation.isPending}
            className="complaint-btn-submit"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </div>
    </div>
  );
}

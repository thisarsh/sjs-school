import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import './ComplaintForm.css';

export default function ComplaintForm({ applicant, role }: { applicant: any, role: 'STUDENT' | 'TEACHER' }) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    isAnonymous: false
  });
  
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
      setView('list');
      setFormData({ subject: '', description: '', isAnonymous: false });
    }
  });

  if (view === 'list') {
    return (
      <div className="complaint-module">
        <div className="complaint-header">
          <h2 className="complaint-title">My Grievances</h2>
          <button className="complaint-btn-primary" onClick={() => setView('create')}>
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
    <div className="complaint-module">
      <div className="complaint-header" style={{ marginBottom: '16px' }}>
        <button className="complaint-back-btn" onClick={() => setView('list')}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      </div>

      <div className="complaint-form-container">
        <h2 className="complaint-title" style={{ marginBottom: '24px' }}>Register Complaint</h2>
        
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
            onClick={() => setView('list')}
            className="complaint-btn-cancel"
          >
            Cancel
          </button>
          <button 
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

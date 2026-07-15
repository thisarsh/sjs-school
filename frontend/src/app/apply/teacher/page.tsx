'use client';

import React, { useState, useRef } from 'react';
import './apply.css';
import ImageCropper from '@/components/ImageCropper';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TeacherApplicationForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    qualification: '',
    experience: '',
    subject: '',
    profilePic: ''
  });
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // Image Upload States
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (previewUrl: string, file: File) => {
    setCropImageSrc(null);
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE}/upload/application-photo`, {
        method: 'POST',
        body: fd
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData(prev => ({ ...prev, profilePic: data.url }));
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setErrorMsg('Failed to upload profile photo to server. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneClean = formData.phone.trim();
    if (!/^[1-9][0-9]{9}$/.test(phoneClean)) {
      setStatus('ERROR');
      setErrorMsg('Phone number must be strictly 10 digits. Do not include starting 0 or +91 code.');
      return;
    }

    setStatus('SUBMITTING');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/teachers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, classes: selectedClasses.join(', ') })
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409 || data.error === 'DUPLICATE_EMAIL' || (typeof data.error === 'string' && data.error.includes('duplicate'))) {
          setDuplicateModal(true);
          setStatus('IDLE');
          return;
        }
        throw new Error(data.error || 'Failed to submit application');
      }

      setStatus('SUCCESS');
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMsg(err.message || 'Network error occurred');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="apply-wrap">
        <div className="apply-container">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2 className="form-title">Application Submitted!</h2>
            <p className="form-desc" style={{ fontSize: '16px', marginTop: '12px' }}>
              Thank you for applying to join our faculty directory. Your submission has been securely received.
            </p>
            <p className="form-desc" style={{ marginTop: '8px' }}>
              The Principal will review your application shortly. Once approved, you will receive login access to the teacher portal.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              <button 
                className="submit-btn-gform" 
                onClick={() => {
                  setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', qualification: '', experience: '', subject: '', profilePic: '' });
                  setStatus('IDLE');
                }}
              >
                Submit Another Response
              </button>
              <button 
                type="button" 
                onClick={() => window.location.href = '/'} 
                style={{ background: 'transparent', border: '1px solid #dadce0', color: '#5f6368', padding: '12px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Back to Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-wrap">
      <div className="apply-container">
        <div className="form-header-card">
          <h1 className="form-title">Teacher Onboarding Application</h1>
          <p className="form-desc">
            Please fill out this form to register as a teacher in our school ERP system. 
            Required fields are marked with a red asterisk (<span className="req-star">*</span>).
          </p>
        </div>

        {errorMsg && (
            <div className="error-card" style={{ background: '#fce8e6', padding: '16px', borderRadius: '8px', color: '#d93025', marginBottom: '16px' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '8px' }}></i>
              {errorMsg}
            </div>
          )}

          {cropImageSrc && (
            <ImageCropper 
              imageSrc={cropImageSrc} 
              onCropComplete={handleCropComplete} 
              onCancel={() => {
                setCropImageSrc(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }} 
            />
          )}

          <div className="form-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label className="field-label" style={{ alignSelf: 'flex-start' }}>Profile Picture</label>
            <div 
              style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', border: '2px dashed #ccc', marginBottom: '16px', position: 'relative' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingImage ? (
                <span style={{ fontSize: '12px', color: '#5f6368' }}>Uploading...</span>
              ) : formData.profilePic ? (
                <img src={formData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="fa-solid fa-camera" style={{ fontSize: '24px', color: '#5f6368' }}></i>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <span style={{ fontSize: '12px', color: '#5f6368' }}>Click to {formData.profilePic ? 'change' : 'upload'} photo (Max 70KB)</span>
          </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-card">
            <div className="row-grid">
              <div>
                <label className="field-label" htmlFor="firstName">First Name <span className="req-star">*</span></label>
                <input required className="field-input" id="firstName" name="firstName" placeholder="Your answer" value={formData.firstName} onChange={handleChange} />
              </div>
              <div>
                <label className="field-label" htmlFor="lastName">Last Name <span className="req-star">*</span></label>
                <input required className="field-input" id="lastName" name="lastName" placeholder="Your answer" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-card">
            <label className="field-label" htmlFor="email">Email Address <span className="req-star">*</span></label>
            <input required type="email" className="field-input" id="email" name="email" placeholder="e.g. teacher@school.edu" value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-card">
            <label className="field-label" htmlFor="phone">Phone Number <span className="req-star">*</span></label>
            <input 
              required 
              type="tel" 
              className="field-input" 
              id="phone" 
              name="phone" 
              maxLength={10}
              placeholder="Exactly 10 digits (e.g. 9876543210)" 
              value={formData.phone} 
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.startsWith('0')) val = val.substring(1);
                setFormData({ ...formData, phone: val });
              }} 
            />
            <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '6px' }}>
              ⚠️ Strictly 10 digits only. Do not add starting 0 or +91.
            </div>
          </div>

          <div className="form-card">
            <label className="field-label" htmlFor="address">Residential Address <span className="req-star">*</span></label>
            <textarea required className="field-textarea" id="address" name="address" placeholder="Full street address, City, State, PIN" value={formData.address} onChange={handleChange}></textarea>
          </div>

          <div className="form-card">
            <div className="row-grid">
              <div>
                <label className="field-label" htmlFor="subject">Primary Subject <span className="req-star">*</span></label>
                <input required className="field-input" id="subject" name="subject" placeholder="e.g. Mathematics, Science, English" value={formData.subject} onChange={handleChange} />
              </div>
              <div>
                <label className="field-label" htmlFor="qualification">Highest Qualification <span className="req-star">*</span></label>
                <input required className="field-input" id="qualification" name="qualification" placeholder="e.g. M.Sc, B.Ed, Ph.D" value={formData.qualification} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-card">
            <label className="field-label">Classes & Sections You Teach <span className="req-star">*</span></label>
            <p style={{ fontSize: '13px', color: '#5f6368', marginBottom: '12px' }}>Select one or multiple class sections:</p>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #dadce0', borderRadius: '8px', padding: '12px', background: '#f8f9fa' }}>
              {['PG', 'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((gr) => (
                <div key={gr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 700, minWidth: '70px', color: '#0a192f', fontSize: '13px' }}>
                    {['PG', 'Nursery', 'KG'].includes(gr) ? gr : `Class ${gr}`}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['A', 'B', 'C', 'D', 'E'].map((sec) => {
                      const clsName = `${gr} ${sec}`;
                      const isSelected = selectedClasses.includes(clsName);
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedClasses(selectedClasses.filter(c => c !== clsName));
                            } else {
                              setSelectedClasses([...selectedClasses, clsName]);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isSelected ? '1px solid #0a192f' : '1px solid #dadce0',
                            background: isSelected ? '#0a192f' : 'white',
                            color: isSelected ? 'white' : '#5f6368',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {sec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {selectedClasses.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#0a192f', fontWeight: 600 }}>
                Selected ({selectedClasses.length}): <span style={{ color: '#c9a84c' }}>{selectedClasses.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="form-card">
            <label className="field-label" htmlFor="experience">Teaching Experience (Years / Details)</label>
            <input className="field-input" id="experience" name="experience" placeholder="e.g. 5 Years at DPS High School" value={formData.experience} onChange={handleChange} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="submit" disabled={status === 'SUBMITTING'} className="submit-btn-gform">
                {status === 'SUBMITTING' ? 'Submitting...' : 'Submit Application'}
              </button>
              <button type="button" onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: '1px solid #dadce0', color: '#5f6368', padding: '12px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Back to Portal
              </button>
            </div>
            <span style={{ fontSize: '12px', color: '#5f6368' }}>Never submit passwords through Google Forms.</span>
          </div>
        </form>
      </div>

      {/* CENTERED POPUP MODAL: DUPLICATE EMAIL */}
      {duplicateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setDuplicateModal(false)}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid rgba(201,168,76,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#0a192f', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #c9a84c' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>⚠️ Application Exists</h3>
              <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => setDuplicateModal(false)}>✕</button>
            </div>
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0a192f', marginBottom: '8px' }}>Email Already Registered</div>
              <div style={{ fontSize: '14px', color: '#5f6368', lineHeight: 1.5 }}>
                An application or account with <strong>{formData.email}</strong> already exists.<br/><br/>
                Please wait for the Principal&apos;s response or onboarding approval.
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8f9fa', borderTop: '1px solid #dadce0', display: 'flex', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDuplicateModal(false)} style={{ background: '#0a192f', color: 'white', border: 'none', padding: '10px 36px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

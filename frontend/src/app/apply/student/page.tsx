'use client';

import React, { useState, useRef } from 'react';
import '../teacher/apply.css';
import ImageCropper from '@/components/ImageCropper';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function StudentApplicationForm() {
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    scholarNumber: '',
    classApplying: '',
    section: '',
    rollNumber: '',
    dob: '',
    gender: '',
    fatherName: '',
    motherName: '',
    parentMobile: '',
    parentSecondaryMobile: '',
    parentEmail: '',
    address: '',
    aadhaarNumber: '',
    bloodGroup: '',
    profilePic: '',
    useSchoolTransport: false,
    transportId: ''
  });
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Image Upload States
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scholarNumberError, setScholarNumberError] = useState('');
  const [transportsList, setTransportsList] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchTransports = async () => {
      try {
        const res = await fetch(`${API_BASE}/transport`);
        if (res.ok) {
          const json = await res.json();
          setTransportsList(json.data || []);
        }
      } catch (err) {
        console.error('Error fetching transports list', err);
      }
    };
    fetchTransports();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'scholarNumber' && scholarNumberError) {
      setScholarNumberError('');
    }
  };

  const handleScholarNumberBlur = async () => {
    if (!formData.scholarNumber) return;
    try {
      const res = await fetch(`${API_BASE}/students/check-scholar-number?scholarNumber=${formData.scholarNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isDuplicate) {
          setScholarNumberError('This scholar number is already registered.');
        } else {
          setScholarNumberError('');
        }
      }
    } catch (err) {
      console.error('Error checking scholar number', err);
    }
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
      setFormData((prev: any) => ({ ...prev, profilePic: data.url }));
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

    const phoneClean = formData.parentMobile.trim();
    if (!/^[1-9][0-9]{9}$/.test(phoneClean)) {
      setStatus('ERROR');
      setErrorMsg('Parent mobile number must be strictly 10 digits. Do not include starting 0 or +91 code.');
      return;
    }

    const secPhoneClean = formData.parentSecondaryMobile.trim();
    if (!/^[1-9][0-9]{9}$/.test(secPhoneClean)) {
      setStatus('ERROR');
      setErrorMsg('Parent secondary mobile number must be strictly 10 digits. Do not include starting 0 or +91 code.');
      return;
    }

    if (!formData.classApplying) {
      setStatus('ERROR');
      setErrorMsg('Please select the class applying for.');
      return;
    }
    
    if (!formData.gender) {
      setStatus('ERROR');
      setErrorMsg('Please select a gender.');
      return;
    }

    const isTransportEnabled = formData.useSchoolTransport === 'true' || formData.useSchoolTransport === true;
    if (isTransportEnabled && !formData.transportId) {
      setStatus('ERROR');
      setErrorMsg('Please select a school transport route/vehicle.');
      return;
    }

    setStatus('SUBMITTING');
    setErrorMsg('');

    const submitPayload = {
      ...formData,
      useSchoolTransport: isTransportEnabled,
      transportId: isTransportEnabled ? formData.transportId : null
    };

    try {
      const res = await fetch(`${API_BASE}/students/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes && (data.error.includes('Unique constraint failed') || data.error.includes('DUPLICATE_SCHOLAR_NUMBER'))) {
            throw new Error('Scholar number is already registered.');
        }
        throw new Error(data.error || 'Failed to submit application');
      }

      setStatus('SUCCESS');
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMsg(err.message || 'Network error. Please try again.');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="apply-wrap">
        <div className="apply-container">
          <div className="form-header-card">
            <h1 className="form-title">Application Submitted</h1>
            <p className="form-desc">
              Thank you for applying to SJS Public School. We have received your admission application and will contact you shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-wrap">
      <div className="apply-container">
        <div className="form-header-card">
          <h1 className="form-title">Student Admission Form</h1>
          <p className="form-desc">SJS Public School - Please fill out the form below carefully.</p>
          <div className="form-required-note">* Indicates required question</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
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

          <div className="form-card">
            <label className="field-label">Student First Name <span className="req-star">*</span></label>
            <input type="text" name="firstName" className="field-input" required value={formData.firstName} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Student Last Name</label>
            <input type="text" name="lastName" className="field-input" value={formData.lastName} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label" style={{ display: 'flex', flexDirection: 'column' }}>
              <span>Scholar No <span className="req-star">*</span></span>
              {scholarNumberError && <span style={{ color: '#d93025', fontSize: '12px', marginTop: '4px' }}>{scholarNumberError}</span>}
            </label>
            <input 
              type="text" 
              name="scholarNumber" 
              className={`field-input ${scholarNumberError ? 'input-error' : ''}`} 
              required 
              value={formData.scholarNumber} 
              onChange={handleChange} 
              onBlur={handleScholarNumberBlur}
              placeholder="Your answer" 
            />
          </div>

          <div className="form-card">
            <label className="field-label">Class Applying For <span className="req-star">*</span></label>
            <select name="classApplying" className="field-select" required value={formData.classApplying} onChange={handleChange}>
              <option value="" disabled>Choose</option>
              <option value="Nursery">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={`${i+1}`}>{i+1}</option>
              ))}
            </select>
          </div>
          
          <div className="form-card">
            <label className="field-label">Section</label>
            <select name="section" className="field-select" value={formData.section} onChange={handleChange}>
              <option value="" disabled>Choose</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>

          <div className="form-card">
            <label className="field-label">Roll No.</label>
            <input type="text" name="rollNumber" className="field-input" value={formData.rollNumber} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Date of Birth <span className="req-star">*</span></label>
            <input type="text" name="dob" className="field-input" required value={formData.dob} onChange={handleChange} placeholder="dd/mm/yyyy" pattern="\d{2}/\d{2}/\d{4}" title="Format: dd/mm/yyyy" />
          </div>

          <div className="form-card">
            <label className="field-label">Gender <span className="req-star">*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                <input type="radio" name="gender" value="Male" onChange={handleChange} checked={formData.gender === 'Male'} />
                Male
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                <input type="radio" name="gender" value="Female" onChange={handleChange} checked={formData.gender === 'Female'} />
                Female
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                <input type="radio" name="gender" value="Other" onChange={handleChange} checked={formData.gender === 'Other'} />
                Other
              </label>
            </div>
          </div>

          <div className="form-card">
            <label className="field-label">Father's Name <span className="req-star">*</span></label>
            <input type="text" name="fatherName" className="field-input" required value={formData.fatherName} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Mother's Name <span className="req-star">*</span></label>
            <input type="text" name="motherName" className="field-input" required value={formData.motherName} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Parent Mobile Number <span className="req-star">*</span></label>
            <input type="text" name="parentMobile" className="field-input" required value={formData.parentMobile} onChange={handleChange} placeholder="10-digit mobile number" pattern="^[1-9][0-9]{9}$" title="Must be exactly 10 digits, no starting 0" maxLength={10} minLength={10} />
          </div>

          <div className="form-card">
            <label className="field-label">Parent Secondary Mobile Number <span className="req-star">*</span></label>
            <input type="text" name="parentSecondaryMobile" className="field-input" required value={formData.parentSecondaryMobile} onChange={handleChange} placeholder="10-digit mobile number" pattern="^[1-9][0-9]{9}$" title="Must be exactly 10 digits, no starting 0" maxLength={10} minLength={10} />
          </div>

          <div className="form-card">
            <label className="field-label">Parent Email (Optional)</label>
            <input type="email" name="parentEmail" className="field-input" value={formData.parentEmail} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Residential Address <span className="req-star">*</span></label>
            <textarea name="address" className="field-textarea" required value={formData.address} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Aadhaar Number (Optional)</label>
            <input type="text" name="aadhaarNumber" className="field-input" value={formData.aadhaarNumber} onChange={handleChange} placeholder="Your answer" pattern="^[0-9]*$" title="Must contain only numbers" maxLength={12} />
          </div>

          <div className="form-card">
            <label className="field-label">Blood Group (Optional)</label>
            <input type="text" name="bloodGroup" className="field-input" value={formData.bloodGroup} onChange={handleChange} placeholder="Your answer" />
          </div>

          <div className="form-card">
            <label className="field-label">Do you use school transport? <span className="req-star">*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                <input 
                  type="radio" 
                  name="useSchoolTransport" 
                  value="true" 
                  onChange={handleChange} 
                  checked={formData.useSchoolTransport === 'true' || formData.useSchoolTransport === true} 
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                <input 
                  type="radio" 
                  name="useSchoolTransport" 
                  value="false" 
                  onChange={handleChange} 
                  checked={formData.useSchoolTransport === 'false' || formData.useSchoolTransport === false} 
                />
                No
              </label>
            </div>
          </div>

          {(formData.useSchoolTransport === 'true' || formData.useSchoolTransport === true) && (
            <div className="form-card" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label className="field-label">Select Available Transport Route & Vehicle <span className="req-star">*</span></label>
              <select 
                name="transportId" 
                className="field-select" 
                required 
                value={formData.transportId} 
                onChange={handleChange}
                style={{ marginTop: '12px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                <option value="" disabled>Choose Route/Vehicle</option>
                {transportsList.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    [{t.type}] {t.name || 'Unlabeled'} - {t.route || 'No route specified'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
            <button type="submit" className="submit-btn-gform" disabled={status === 'SUBMITTING'}>
              {status === 'SUBMITTING' ? 'Submitting...' : 'Submit'}
            </button>
            <button type="button" onClick={() => setFormData({
              firstName: '', lastName: '', scholarNumber: '', classApplying: '', section: '', rollNumber: '',
              dob: '', gender: '', fatherName: '', motherName: '', parentMobile: '', parentSecondaryMobile: '', parentEmail: '', address: '', aadhaarNumber: '', bloodGroup: '', profilePic: ''
            })} style={{ background: 'transparent', border: 'none', color: '#673ab7', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              Clear form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import ImageCropper from '@/components/ImageCropper';

export default function TeacherProfileView({ teacherProfile, setGlobalAlert }: any) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>({});
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (teacherProfile && !isEditingProfile) {
      setProfileFormData({
        firstName: teacherProfile.firstName || '',
        lastName: teacherProfile.lastName || '',
        phone: teacherProfile.phone || '',
        address: teacherProfile.address || '',
        subject: teacherProfile.subject || '',
        qualification: teacherProfile.qualification || '',
        experience: teacherProfile.experience || '',
        profilePic: teacherProfile.profilePic || ''
      });
    }
  }, [teacherProfile, isEditingProfile]);

  const handleProfileChange = (e: any) => {
    const { name, value } = e.target;
    setProfileFormData({ ...profileFormData, [name]: value });
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (previewUrl: string, file: File) => {
    setCropImageSrc(null);
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('sjs_token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/upload/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setProfileFormData((prev: any) => ({ ...prev, profilePic: data.url }));
      setGlobalAlert({ message: 'Image uploaded successfully!', type: 'success' });
    } catch (error) {
      setGlobalAlert({ message: 'Failed to upload image.', type: 'error' });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async (e: any) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.put('/teachers/me', profileFormData);
      queryClient.invalidateQueries({ queryKey: ['teacherProfile'] });
      setGlobalAlert({ message: 'Profile updated successfully!', type: 'success' });
      setIsEditingProfile(false);
    } catch (err: any) {
      setGlobalAlert({ message: err.response?.data?.error || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("sjs_token");
      if (token) {
        await api.post("/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("sjs_token");
      localStorage.removeItem("sjs_user");
      router.push("/");
    }
  };

  return (
    <>
      {cropImageSrc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}>
          <ImageCropper
            imageSrc={cropImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setCropImageSrc(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
        </div>
      )}

      <div className="view-panel active" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>My Profile</h2>
          {!isEditingProfile && (
            <button onClick={() => setIsEditingProfile(true)} style={{ background: '#111827', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Edit Profile
            </button>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div
              style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: isEditingProfile ? 'pointer' : 'default', border: '2px dashed #e5e7eb', position: 'relative' }}
              onClick={() => isEditingProfile && fileInputRef.current?.click()}
            >
              {isUploadingImage ? (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Uploading...</span>
              ) : profileFormData.profilePic || teacherProfile?.profilePic ? (
                <img src={profileFormData.profilePic || teacherProfile?.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="fa-solid fa-camera" style={{ fontSize: '24px', color: '#9ca3af' }}></i>
              )}
              {isEditingProfile && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>Edit</div>
              )}
            </div>
            <input id="profilePicUpload" name="profilePicUpload" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          </div>

          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="firstName" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>First Name</label>
                <input id="firstName" disabled={!isEditingProfile} required name="firstName" autoComplete="given-name" value={profileFormData.firstName || ''} onChange={handleProfileChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="lastName" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Last Name</label>
                <input id="lastName" disabled={!isEditingProfile} required name="lastName" autoComplete="family-name" value={profileFormData.lastName || ''} onChange={handleProfileChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label htmlFor="phone" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Phone Number</label>
              <input id="phone" disabled={!isEditingProfile} type="tel" name="phone" autoComplete="tel-national" maxLength={10} value={profileFormData.phone || ''} onChange={(e) => { let val = e.target.value.replace(/\D/g, ''); if (val.startsWith('0')) val = val.substring(1); setProfileFormData({ ...profileFormData, phone: val }); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label htmlFor="address" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Residential Address</label>
              <textarea id="address" disabled={!isEditingProfile} required name="address" autoComplete="street-address" value={profileFormData.address || ''} onChange={handleProfileChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="subject" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Primary Subject</label>
                <input id="subject" disabled={!isEditingProfile} required name="subject" autoComplete="off" value={profileFormData.subject || ''} onChange={handleProfileChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="qualification" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Qualification</label>
                <input id="qualification" disabled={!isEditingProfile} required name="qualification" autoComplete="off" value={profileFormData.qualification || ''} onChange={handleProfileChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label htmlFor="experience" style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Experience</label>
              <input id="experience" disabled={!isEditingProfile} required name="experience" autoComplete="off" value={profileFormData.experience || ''} onChange={handleProfileChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: isEditingProfile ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {isEditingProfile && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditingProfile(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSavingProfile || isUploadingImage} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#111827', color: 'white', fontWeight: 700, cursor: isSavingProfile || isUploadingImage ? 'not-allowed' : 'pointer', opacity: isSavingProfile || isUploadingImage ? 0.7 : 1 }}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        <button onClick={handleLogout} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
        </button>
      </div>
    </>
  );
}

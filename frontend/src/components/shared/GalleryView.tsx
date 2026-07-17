import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import imageCompression from 'browser-image-compression';
import './GalleryView.css';

export default function GalleryView() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [selectedImage, setSelectedImage] = useState<any | null>(null); // For Lightbox
  const [imageToDelete, setImageToDelete] = useState<string | null>(null); // For Delete Confirmation
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("sjs_user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const isManagement = user && ['TEACHER', 'PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase());

  // Fetch gallery images
  const { data: images = [], isLoading, refetch } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const res = await api.get('/gallery');
      return res.data?.data || [];
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select an image file');
      return;
    }

    setIsCompressing(true);
    setUploadError('');

    try {
      // 1. Compress Image (target quality < 80%)
      const options = {
        maxSizeMB: 0.3,          // Max 300KB
        maxWidthOrHeight: 1024,  // Reasonable size for web display
        useWebWorker: true,
        initialQuality: 0.8      // Compresses to 80% size/quality
      };

      const compressedBlob = await imageCompression(selectedFile, options);
      const finalFile = new File([compressedBlob], selectedFile.name, { type: selectedFile.type });

      setIsCompressing(false);
      setIsUploading(true);

      // 2. Upload to backend
      const fd = new FormData();
      fd.append('image', finalFile);
      if (description.trim()) {
        fd.append('description', description.trim());
      }

      await api.post('/gallery', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reset states
      setSelectedFile(null);
      setImagePreview(null);
      setDescription('');
      setIsUploadModalOpen(false);
      
      // Invalidate query to refetch images
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setUploadError(err.response?.data?.error || 'Failed to compress or upload image. Please try again.');
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening lightbox
    setImageToDelete(id);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/gallery/${imageToDelete}`);
      setImageToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      alert(err.response?.data?.error || 'Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="gallery-wrap">
      <div className="gallery-header">
        <h2 className="gallery-title">
          <i className="fa-solid fa-images" style={{ color: '#4f46e5' }}></i>
          School Gallery
        </h2>
        {isManagement && (
          <button 
            className="gallery-upload-btn"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            Upload Image
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: '#4f46e5', marginBottom: '12px' }}></i>
          <div>Loading gallery...</div>
        </div>
      ) : images.length === 0 ? (
        <div className="gallery-empty">
          <i className="fa-regular fa-image"></i>
          <div className="gallery-empty-text">No images shared yet</div>
          <div className="gallery-empty-sub">
            {isManagement ? "Be the first to share an image with the school!" : "Images shared by teachers or principal will appear here."}
          </div>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.map((img: any) => (
            <div 
              key={img.id} 
              className="gallery-card"
            >
              {isManagement && (
                <button 
                  className="gallery-card-delete"
                  onClick={(e) => handleDeleteClick(img.id, e)}
                  title="Delete image"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              )}
              <div className="gallery-img-container" onClick={() => setSelectedImage(img)}>
                <img 
                  src={img.url} 
                  alt={img.description || "Gallery image"} 
                  className="gallery-img"
                  loading="lazy"
                />
              </div>
              <div className="gallery-info">
                <p className="gallery-desc">
                  {img.description || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>No description</span>}
                </p>
                <div className="gallery-meta">
                  <span className="gallery-author" title={img.uploadedByName || img.email || 'Staff'}>
                    By: {img.uploadedByName || (img.email ? img.email.split('@')[0] : 'Staff')}
                  </span>
                  <span className="gallery-date">
                    {new Date(img.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <button className="lightbox-close" onClick={() => setSelectedImage(null)}>✕</button>
          <div className="lightbox-img-container" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.url} alt="Expanded view" className="lightbox-img" />
          </div>
          {selectedImage.description && (
            <div className="lightbox-caption" onClick={(e) => e.stopPropagation()}>
              {selectedImage.description}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {imageToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px 24px', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-trash"></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
              Delete Image?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setImageToDelete(null)}
                disabled={isDeleting}
                style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', transition: 'all 0.2s' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Upload Image to Gallery</h3>
              <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setImagePreview(null); setDescription(''); setUploadError(''); }} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploadError && (
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                  {uploadError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Description / Caption</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g. Annual Sports Meet 2025" 
                  maxLength={100}
                  disabled={isCompressing || isUploading}
                  style={{ padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Select Image</label>
                <div 
                  onClick={() => !isCompressing && !isUploading && document.getElementById('gallery-file-input')?.click()}
                  style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', position: 'relative', overflow: 'hidden', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <i className="fa-regular fa-image" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '8px' }}></i>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Click to browse image file</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>PNG, JPG or WEBP formats</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  id="gallery-file-input" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  style={{ display: 'none' }} 
                  disabled={isCompressing || isUploading}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setImagePreview(null); setDescription(''); setUploadError(''); }}
                  disabled={isCompressing || isUploading}
                  style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedFile || isCompressing || isUploading}
                  style={{ flex: 1, background: 'var(--navy, #111827)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFile || isCompressing || isUploading) ? 0.6 : 1 }}
                >
                  {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

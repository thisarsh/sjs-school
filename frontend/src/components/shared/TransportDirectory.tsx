"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { createPortal } from 'react-dom';
import './TransportDirectory.css';

export default function TransportDirectory() {
  const [role, setRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form Fields State
  const [vehicleType, setVehicleType] = useState('Bus');
  const [vehicleName, setVehicleName] = useState('');
  const [route, setRoute] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [conductorName, setConductorName] = useState('');
  const [conductorPhone, setConductorPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('sjs_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setRole(u.role || '');
      } catch (e) {}
    }
  }, []);

  const canManage = role === 'PRINCIPAL' || role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN';

  // Fetch Transports
  const { data: transports = [], isLoading } = useQuery({
    queryKey: ['transports'],
    queryFn: async () => {
      const token = localStorage.getItem('sjs_token');
      const res = await api.get('/transport', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? [];
    }
  });

  // Fetch student profile if role is student to know their assigned transport
  const { data: studentProfile } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const token = localStorage.getItem('sjs_token');
      const res = await api.get('/students/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: role === 'STUDENT'
  });

  // Create Transport Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('sjs_token');
      const res = await api.post('/transport', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      closeFormModal();
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to save transport');
    }
  });

  // Update Transport Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      const token = localStorage.getItem('sjs_token');
      const res = await api.put(`/transport/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      closeFormModal();
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to update transport');
    }
  });

  // Delete Transport Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('sjs_token');
      await api.delete(`/transport/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      setIsDeleteConfirmOpen(null);
    }
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'Bus': return { class: 'fa-solid fa-bus icon-bus', label: 'Bus' };
      case 'Van': return { class: 'fa-solid fa-shuttle-van icon-van', label: 'Van' };
      case 'Magic': return { class: 'fa-solid fa-caravan icon-magic', label: 'Magic' };
      case 'Cruiser': return { class: 'fa-solid fa-truck-monster icon-cruiser', label: 'Cruiser' };
      case 'Auto': return { class: 'fa-solid fa-motorcycle icon-auto', label: 'Auto' };
      default: return { class: 'fa-solid fa-truck icon-other', label: 'Other' };
    }
  };

  const openFormModal = (target: any = null) => {
    if (target) {
      setEditTarget(target);
      setVehicleType(target.type || 'Bus');
      setVehicleName(target.name || '');
      setRoute(target.route || '');
      setVehicleNumber(target.vehicleNumber || '');
      setDriverName(target.driverName || '');
      setDriverPhone(target.driverPhone || '');
      setConductorName(target.conductorName || '');
      setConductorPhone(target.conductorPhone || '');
    } else {
      setEditTarget(null);
      setVehicleType('Bus');
      setVehicleName('');
      setRoute('');
      setVehicleNumber('');
      setDriverName('');
      setDriverPhone('');
      setConductorName('');
      setConductorPhone('');
    }
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditTarget(null);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleType) {
      setErrorMessage('Please select a vehicle type');
      return;
    }

    const payload = {
      type: vehicleType,
      name: vehicleName || null,
      route: route || null,
      vehicleNumber: vehicleNumber || null,
      driverName: driverName || null,
      driverPhone: driverPhone || null,
      conductorName: conductorName || null,
      conductorPhone: conductorPhone || null
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="transport-container">
      <div className="transport-header">
        <h2 className="transport-title">Transport Services</h2>
        {canManage && (
          <button className="transport-btn-primary" onClick={() => openFormModal(null)}>
            <i className="fa-solid fa-plus"></i> Add Vehicle
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontWeight: 600 }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px', fontSize: '20px' }}></i> Loading transport details...
        </div>
      ) : transports.length === 0 ? (
        <div className="transport-empty-state">
          <div className="transport-empty-icon">
            <i className="fa-solid fa-bus"></i>
          </div>
          <div className="transport-empty-title">No Vehicles Registered</div>
          <div className="transport-empty-sub">Transport routes and vehicle schedules will appear here once added.</div>
        </div>
      ) : (
        <div className="transport-grid">
          {[...transports]
            .sort((a, b) => {
              // Push student's own transport to top
              if (studentProfile?.transportId === a.id) return -1;
              if (studentProfile?.transportId === b.id) return 1;
              return 0;
            })
            .map((t: any) => {
            const iconInfo = getVehicleIcon(t.type);
            const isStudentTransport = studentProfile?.transportId === t.id;
            const iconClasses = iconInfo.class.split(' '); // [0] = fa-solid, [1] = fa-bus, [2] = icon-bus

            return (
              <div 
                key={t.id} 
                className="transport-card" 
                style={isStudentTransport ? {
                  border: '2px solid #4f46e5',
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)',
                  transform: 'translateY(-2px)'
                } : {}}
              >
                {isStudentTransport && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '20px',
                    background: '#4f46e5',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                  }}>
                    <i className="fa-solid fa-star" style={{ marginRight: '4px' }}></i> Your Transport
                  </div>
                )}
                <div className="transport-card-header">
                  <div className="transport-type-badge">
                    <div className={`transport-icon-container ${iconClasses[2] || ''}`}>
                      <i className={`${iconClasses[0]} ${iconClasses[1]}`}></i>
                    </div>
                    <div className="transport-meta-info">
                      <span className="transport-vehicle-type">{iconInfo.label}</span>
                      <span className="transport-vehicle-name">{t.name || 'Unlabeled Vehicle'}</span>
                    </div>
                  </div>
                  
                  {canManage && (
                    <div className="transport-actions-menu">
                      <button className="transport-action-btn btn-edit" title="Edit Vehicle" onClick={() => openFormModal(t)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="transport-action-btn btn-delete" title="Delete Vehicle" onClick={() => setIsDeleteConfirmOpen(t.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>

                {t.route && (
                  <div className="transport-route-section">
                    <span className="detail-label">Route</span>
                    <span className="route-text">{t.route}</span>
                  </div>
                )}

                <div className="transport-details-grid">
                  {t.vehicleNumber && (
                    <div className="detail-item">
                      <span className="detail-label">Reg Number</span>
                      <span className="detail-value">{t.vehicleNumber}</span>
                    </div>
                  )}
                  {t.driverName && (
                    <div className="detail-item">
                      <span className="detail-label">Driver</span>
                      <span className="detail-value">{t.driverName}</span>
                    </div>
                  )}
                  {t.driverPhone && (
                    <div className="detail-item">
                      <span className="detail-label">Driver Phone</span>
                      <a href={`tel:${t.driverPhone}`} className="detail-phone">
                        <i className="fa-solid fa-phone" style={{ fontSize: '10px' }}></i> {t.driverPhone}
                      </a>
                    </div>
                  )}
                  {t.conductorName && (
                    <div className="detail-item">
                      <span className="detail-label">Conductor</span>
                      <span className="detail-value">{t.conductorName}</span>
                    </div>
                  )}
                  {t.conductorPhone && (
                    <div className="detail-item">
                      <span className="detail-label">Conductor Phone</span>
                      <a href={`tel:${t.conductorPhone}`} className="detail-phone">
                        <i className="fa-solid fa-phone" style={{ fontSize: '10px' }}></i> {t.conductorPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM DIALOG MODAL */}
      {isModalOpen && mounted && createPortal(
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editTarget ? 'Edit Transport Vehicle' : 'Add Transport Vehicle'}</h3>
              <button className="modal-close" onClick={closeFormModal}>✕</button>
            </div>

            {errorMessage && (
              <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="form-select">
                  <option value="Bus">Bus</option>
                  <option value="Van">Van</option>
                  <option value="Magic">Magic</option>
                  <option value="Cruiser">Cruiser</option>
                  <option value="Auto">Auto</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Name / Label (Optional)</label>
                <input 
                  type="text" 
                  value={vehicleName} 
                  onChange={(e) => setVehicleName(e.target.value)} 
                  placeholder="E.g. Bus 12 / Sector E Special" 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Route / Stops (Optional)</label>
                <input 
                  type="text" 
                  value={route} 
                  onChange={(e) => setRoute(e.target.value)} 
                  placeholder="E.g. Vijay Nagar to Super Corridor" 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Number (Optional)</label>
                <input 
                  type="text" 
                  value={vehicleNumber} 
                  onChange={(e) => setVehicleNumber(e.target.value)} 
                  placeholder="E.g. MP-09-AB-1234" 
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Driver Name (Optional)</label>
                  <input 
                    type="text" 
                    value={driverName} 
                    onChange={(e) => setDriverName(e.target.value)} 
                    placeholder="Driver Name" 
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Driver Contact (Optional)</label>
                  <input 
                    type="tel" 
                    value={driverPhone} 
                    onChange={(e) => setDriverPhone(e.target.value)} 
                    placeholder="Contact Number" 
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Conductor Name (Optional)</label>
                  <input 
                    type="text" 
                    value={conductorName} 
                    onChange={(e) => setConductorName(e.target.value)} 
                    placeholder="Conductor Name" 
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Conductor Contact (Optional)</label>
                  <input 
                    type="tel" 
                    value={conductorPhone} 
                    onChange={(e) => setConductorPhone(e.target.value)} 
                    placeholder="Contact Number" 
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeFormModal}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {isDeleteConfirmOpen && mounted && createPortal(
        <div className="modal-overlay" onClick={() => setIsDeleteConfirmOpen(null)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px 24px', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
              Delete Vehicle?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              Are you sure you want to delete this vehicle from school transport records?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsDeleteConfirmOpen(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary"
                style={{ margin: 0 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(isDeleteConfirmOpen)}
                disabled={deleteMutation.isPending}
                className="btn-submit"
                style={{ background: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', margin: 0 }}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

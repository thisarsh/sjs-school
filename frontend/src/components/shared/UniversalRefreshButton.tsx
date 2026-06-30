"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function UniversalRefreshButton() {
  const pathname = usePathname();
  const [isSpinning, setIsSpinning] = useState(false);

  // Show on all dashboard and profile/apply pages
  if (pathname === '/') return null;

  const handleRefresh = () => {
    setIsSpinning(true);
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      style={{
        position: 'fixed',
        top: '12px',
        right: '12px',
        zIndex: 99999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(79, 70, 229, 0.2)',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
        padding: '6px 12px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      title="Refresh Page if Stuck"
    >
      <i className={`fa-solid fa-rotate-right ${isSpinning ? 'fa-spin' : ''}`} style={{ color: '#4f46e5' }}></i>
      <span>Refresh</span>
    </button>
  );
}

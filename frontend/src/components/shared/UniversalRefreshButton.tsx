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
    <div
      style={{
        position: 'static',
        width: '100%',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}
    >
      <button
        onClick={handleRefresh}
        style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          padding: '5px 14px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#334155',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Refresh Page if Stuck"
      >
        <i className={`fa-solid fa-rotate-right ${isSpinning ? 'fa-spin' : ''}`} style={{ color: '#4f46e5' }}></i>
        <span>Refresh Page</span>
      </button>
    </div>
  );
}

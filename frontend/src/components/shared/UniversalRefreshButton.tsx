"use client";
import React, { useState } from 'react';

export default function UniversalRefreshButton() {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpinning(true);
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(79, 70, 229, 0.2)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: '5px 12px',
        borderRadius: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      title="Refresh Page"
    >
      <i className={`fa-solid fa-rotate-right ${isSpinning ? 'fa-spin' : ''}`} style={{ color: '#4f46e5', fontSize: '13px' }}></i>
      <span>Refresh</span>
    </button>
  );
}

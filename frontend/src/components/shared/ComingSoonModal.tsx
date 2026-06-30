import React from 'react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function ComingSoonModal({ isOpen, onClose, featureName = "Feature" }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        transform: 'scale(1)',
        transition: 'all 0.2s ease-in-out'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f3f4f6',
            border: 'none',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#4b5563',
            fontSize: '16px'
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 20px auto',
          boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
        }}>
          <i className="fa-solid fa-rocket"></i>
        </div>

        <h3 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '8px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {featureName}
        </h3>

        <div style={{
          display: 'inline-block',
          background: '#fef3c7',
          color: '#d97706',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '16px'
        }}>
          Coming Soon
        </div>

        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          We are actively working on building the <strong>{featureName}</strong> module to bring you a premium experience. Stay tuned!
        </p>

        <button
          onClick={onClose}
          style={{
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.2s'
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}

import React from 'react';

interface SchoolLoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export default function SchoolLoadingScreen({
  title = "Loading...",
  subtitle = "Preparing your experience"
}: SchoolLoadingScreenProps) {
  return (
    <div className="school-loading-wrapper">

      <div className="loading-content-box">
        <div className="logo-orbit-container">
          <div className="orbit-ring">
            <div className="orbit-dot-1"></div>
            <div className="orbit-dot-2"></div>
            <div className="orbit-dot-3"></div>
          </div>
          <div className="logo-center-circle" style={{ width: "120px", height: "120px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/assets/logo.png" alt="SJS Logo" className="logo-img" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
          </div>
        </div>

        <h2 className="loading-title">{title}</h2>
        <p className="loading-subtitle">{subtitle}</p>
        <div className="spinner-ring"></div>
      </div>

      <div className="waves-container">
        <svg className="waves-svg wave-layer-1" viewBox="0 0 2400 120" preserveAspectRatio="none">
          <path d="M0,45 C150,90 350,-40 500,45 C650,130 900,10 1200,45 C1350,90 1550,-40 1700,45 C1850,130 2100,10 2400,45 L2400,120 L0,120 Z" />
        </svg>
        <svg className="waves-svg wave-layer-2" viewBox="0 0 2400 120" preserveAspectRatio="none">
          <path d="M0,50 C200,100 450,0 700,60 C950,120 1100,20 1200,50 C1400,100 1650,0 1900,60 C2150,120 2300,20 2400,50 L2400,120 L0,120 Z" />
        </svg>
        <svg className="waves-svg wave-layer-3" viewBox="0 0 2400 120" preserveAspectRatio="none">
          <path d="M0,60 C250,-20 500,110 750,40 C1000,-30 1150,80 1200,60 C1450,-20 1700,110 1950,40 C2200,-30 2350,80 2400,60 L2400,120 L0,120 Z" />
        </svg>
      </div>
    </div>
  );
}

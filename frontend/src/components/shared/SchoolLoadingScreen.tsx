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
      <style jsx>{`
        .school-loading-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdfbf7 0%, #f8f3e7 50%, #f3ece0 100%);
          z-index: 9999;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .loading-content-box {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
        }

        .logo-orbit-container {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }

        .orbit-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1.5px dashed rgba(201, 168, 76, 0.45);
          animation: orbitRotate 12s linear infinite;
        }

        .orbit-dot-1, .orbit-dot-2, .orbit-dot-3 {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #c9a84c;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(201, 168, 76, 0.8);
        }
        .orbit-dot-1 { top: -4px; left: 50%; transform: translateX(-50%); }
        .orbit-dot-2 { bottom: 18px; left: 8px; }
        .orbit-dot-3 { bottom: 18px; right: 8px; }

        .logo-center-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(13, 27, 42, 0.12), 0 0 0 4px rgba(201, 168, 76, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 10px;
          animation: logoPulse 3s ease-in-out infinite;
        }

        .logo-img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        }

        .loading-title {
          font-size: 22px;
          font-weight: 700;
          color: #0d1b2a;
          margin: 0 0 8px 0;
          letter-spacing: -0.3px;
        }

        .loading-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 24px 0;
          font-weight: 500;
        }

        .spinner-ring {
          width: 36px;
          height: 36px;
          border: 3.5px solid rgba(201, 168, 76, 0.25);
          border-top-color: #c9a84c;
          border-right-color: #0d1b2a;
          border-radius: 50%;
          animation: spinFast 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Animated Waves at Bottom */
        .waves-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 120px;
          overflow: hidden;
          line-height: 0;
          z-index: 1;
        }

        .waves-svg {
          position: relative;
          display: block;
          width: 200%;
          height: 120px;
          animation: moveWaves 8s linear infinite;
        }

        .wave-layer-1 {
          fill: rgba(201, 168, 76, 0.18);
          animation: moveWaves 12s linear infinite reverse;
        }
        .wave-layer-2 {
          fill: rgba(201, 168, 76, 0.28);
          animation: moveWaves 8s linear infinite;
        }
        .wave-layer-3 {
          fill: rgba(13, 27, 42, 0.08);
          animation: moveWaves 6s linear infinite reverse;
        }

        @keyframes orbitRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes logoPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(13, 27, 42, 0.12), 0 0 0 4px rgba(201, 168, 76, 0.2); }
          50% { transform: scale(1.03); box-shadow: 0 15px 35px rgba(13, 27, 42, 0.18), 0 0 0 8px rgba(201, 168, 76, 0.35); }
        }

        @keyframes spinFast {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes moveWaves {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="loading-content-box">
        <div className="logo-orbit-container">
          <div className="orbit-ring">
            <div className="orbit-dot-1"></div>
            <div className="orbit-dot-2"></div>
            <div className="orbit-dot-3"></div>
          </div>
          <div className="logo-center-circle">
            <img src="/assets/logo.png" alt="SJS Logo" className="logo-img" />
          </div>
        </div>

        <h2 className="loading-title">{title}</h2>
        <p className="loading-subtitle">{subtitle}</p>
        <div className="spinner-ring"></div>
      </div>

      <div className="waves-container">
        <svg className="waves-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path className="wave-layer-1" d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,45 L1200,120 L0,120 Z" />
          <path className="wave-layer-2" d="M0,30 C200,100 450,0 700,60 C950,120 1100,20 1200,50 L1200,120 L0,120 Z" />
          <path className="wave-layer-3" d="M0,50 C250,-20 500,110 750,40 C1000,-30 1150,80 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </div>
  );
}

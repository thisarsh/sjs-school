"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import "./login.css"; // Ensure this is imported

type Role = "parent" | "student" | "staff";

export default function LoginPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLongLoading, setIsLongLoading] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1024);
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sjs_token");
    const userStr = localStorage.getItem("sjs_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = String(user.role).toUpperCase();
        if (role === "SUPER_ADMIN") router.push("/superadmin");
        else if (role === "PRINCIPAL") router.push("/principal");
        else if (role === "TEACHER") router.push("/teacher");
        else if (role === "STUDENT") router.push("/student");
        else router.push("/dashboard");
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsLongLoading(false);
    setError("");

    const longLoadTimer = setTimeout(() => {
      setIsLongLoading(true);
    }, 3000);

    try {
      const response = await api.post("/auth/login", {
        email: username,
        password: password,
      });

      clearTimeout(longLoadTimer);

      if (response.data.token) {
        localStorage.setItem("sjs_token", response.data.token);
        localStorage.setItem("sjs_user", JSON.stringify(response.data.user));
        
        const role = String(response.data.user.role).toUpperCase();
        if (role === "SUPER_ADMIN") {
          router.push("/superadmin");
        } else if (role === "PRINCIPAL") {
          router.push("/principal");
        } else if (role === "TEACHER") {
          router.push("/teacher");
        } else if (role === "STUDENT") {
          router.push("/student");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      clearTimeout(longLoadTimer);
      setError("Invalid credentials contact administration for help");
    } finally {
      setIsLoading(false);
      setIsLongLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (activeRole === 'parent') return "e.g. scholarno@parent";
    if (activeRole === 'student') return "e.g. scholarno@sjs";
    return "e.g. staff@sjs";
  };

  return (
    <>
      <div className="bg-image"></div>
      <div className="bg-leaves"></div>

      <div className="layout-container">
        
        <div className="brand-section">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="SJS Logo" />
          </div>
          
          <h1 className="school-title">SJS Public School</h1>
          <div className="school-location">
            <i className="fa-solid fa-location-dot"></i>
            Lalganj, Uttar Pradesh
          </div>

          <div className="welcome-title">Welcome <span>Back!</span></div>
          <div className="welcome-decoration">
            <div className="line"></div>
            <div className="dot"></div>
          </div>
          <div className="welcome-subtitle">Sign in to your School Management System</div>

          <div className="badges-desktop">
            <div className="badge">
              <i className="fa-solid fa-shield-halved badge-icon"></i>
              <div className="badge-text"><strong>Excellence</strong><span>in Education</span></div>
            </div>
            <div className="badge">
              <i className="fa-solid fa-trophy badge-icon"></i>
              <div className="badge-text"><strong>Discipline</strong><span>in Practice</span></div>
            </div>
            <div className="badge">
              <i className="fa-regular fa-star badge-icon"></i>
              <div className="badge-text"><strong>Character</strong><span>for Life</span></div>
            </div>
          </div>
        </div>

        <div className="login-section">
          <div className="login-card">
            {!isMobile && <h3 id="mobile-hide-title">Login As</h3>}
            
            <div className="role-grid">
              <div 
                className={`role-btn role-parent ${activeRole === 'parent' ? 'active' : ''}`} 
                onClick={() => setActiveRole('parent')}
              >
                <div className="role-icon"><i className="fa-solid fa-users"></i></div>
                <div className="role-name">Parent</div>
              </div>
              <div 
                className={`role-btn role-student ${activeRole === 'student' ? 'active' : ''}`} 
                onClick={() => setActiveRole('student')}
              >
                <div className="role-icon"><i className="fa-solid fa-graduation-cap"></i></div>
                <div className="role-name">Student</div>
              </div>
              <div 
                className={`role-btn role-staff ${activeRole === 'staff' ? 'active' : ''}`} 
                onClick={() => setActiveRole('staff')}
              >
                <div className="role-icon"><i className="fa-solid fa-briefcase"></i></div>
                <div className="role-name">School Staff</div>
              </div>
            </div>

            <div className="divider">
              <i className="fa-solid fa-shield-halved"></i>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="loginUsername">Username</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-user input-icon"></i>
                  <input 
                    type="text" 
                    id="loginUsername"
                    name="username"
                    className="form-input" 
                    placeholder={getPlaceholder()} 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-lock input-icon"></i>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="loginPassword"
                    name="password"
                    className="form-input" 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <i 
                    className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} eye-icon`} 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  ></i>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-group" htmlFor="rememberMe">
                  <input type="checkbox" id="rememberMe" name="rememberMe" defaultChecked />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i>
                    Sign In
                  </>
                )}
              </button>

              {error && (
                <div className="info-banner" style={{ background: '#fef2f2', borderColor: '#fecaca', marginTop: '1.5vh', display: 'flex' }}>
                  <i className="fa-solid fa-circle-exclamation info-icon" style={{ color: '#ef4444' }}></i>
                  <div className="info-text">
                    <strong>Login Failed</strong> <br/>
                    {error}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {isLongLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, color: 'white', fontFamily: 'inherit', textAlign: 'center', padding: '2rem'
        }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}></i>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Waking up the secure server...</h2>
          <p style={{ opacity: 0.9, fontSize: '1.1rem', maxWidth: '400px' }}>Our encrypted database sleeps when not in use. This first login might take up to 30 seconds.</p>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";

interface StudentAccountViewProps {
  student: any;
  userEmail?: string;
  onLogout: () => void;
}

export default function StudentAccountView({
  student,
  userEmail,
  onLogout,
}: StudentAccountViewProps) {
  // By default, open 'personal' so information is visible immediately upon tapping Account
  const [expandedSection, setExpandedSection] = useState<
    "personal" | "contact" | "documents" | null
  >("personal");
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useMobileBackHandler({
    activeTab: 'account',
    isModalOpen: showLogoutConfirm,
    onCloseModal: () => setShowLogoutConfirm(false),
  });

  const toggleSection = (section: "personal" | "contact" | "documents") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const getInitial = (name?: string) =>
    name ? name.charAt(0).toUpperCase() : "?";

  const fullName = student
    ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
    : "Student Account";
  const className = student?.className || student?.classApplying || "N/A";
  const sectionName = student?.sectionName || student?.section || "";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <div
      style={{
        padding: "16px",
        paddingBottom: "140px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandDown {
          from { opacity: 0; max-height: 0px; transform: scaleY(0.95); }
          to { opacity: 1; max-height: 1200px; transform: scaleY(1); }
        }
        .account-card-btn:active {
          transform: scale(0.985);
        }
      `}</style>

      {/* Top Header Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)",
          borderRadius: "22px",
          padding: "22px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          boxShadow: "0 10px 30px rgba(13, 27, 42, 0.18)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "140px",
            height: "140px",
            background: "radial-gradient(circle, rgba(201,168,76,0.22) 0%, rgba(255,255,255,0) 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "#c9a84c",
            border: "3px solid rgba(255, 255, 255, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            fontWeight: "bold",
            color: "#0d1b2a",
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {student?.profilePic ? (
            <img
              src={student.profilePic}
              alt={fullName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            getInitial(student?.firstName)
          )}
        </div>

        <div style={{ flex: 1, zIndex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.2px",
              lineHeight: "1.2",
            }}
          >
            {fullName}
          </h2>
          <div
            style={{
              fontSize: "13px",
              color: "#c9a84c",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            Scholar No: {student?.scholarNumber || "N/A"}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "4px 12px",
              background: "rgba(255, 255, 255, 0.14)",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Class {className} {sectionName ? `- Sec ${sectionName}` : ""}
          </div>
        </div>
      </div>

      {/* Accordion Sections Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3
          style={{
            margin: "4px 4px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Account Information
        </h3>

        {/* 1. Personal Details Accordion Section */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)" }}>
          <button
            className="account-card-btn"
            onClick={() => toggleSection("personal")}
            style={{
              width: "100%",
              background: expandedSection === "personal" ? "#f8fafc" : "white",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  Personal Details
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Name, Scholar No, DOB & Parents
                </div>
              </div>
            </div>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: expandedSection === "personal" ? "#e2e8f0" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.25s ease" }}>
              <i
                className="fa-solid fa-chevron-down"
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  transform: expandedSection === "personal" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              />
            </div>
          </button>

          {expandedSection === "personal" && (
            <div
              style={{
                padding: "16px 18px",
                borderTop: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              {/* Profile Snapshot Banner */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 12px", background: "#f8fafc", borderRadius: "14px", marginBottom: "4px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "20px", color: "#475569", flexShrink: 0 }}>
                  {student?.profilePic ? (
                    <img src={student.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    getInitial(student?.firstName)
                  )}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{fullName}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Class {className} {sectionName ? `(${sectionName})` : ""}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Scholar Number</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{student?.scholarNumber || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Roll Number</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{student?.rollNumber || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Date of Birth</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{formatDate(student?.dob)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Gender</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px", textTransform: "capitalize" }}>{student?.gender || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Blood Group</span>
                <span style={{ fontWeight: 700, color: "#ef4444", fontSize: "13px" }}>{student?.bloodGroup || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Father's Name</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{student?.fatherName || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Mother's Name</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{student?.motherName || "N/A"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>Residential Address</span>
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px", lineHeight: "1.4" }}>{student?.address || "No address on file"}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Contact Details Accordion Section */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)" }}>
          <button
            className="account-card-btn"
            onClick={() => toggleSection("contact")}
            style={{
              width: "100%",
              background: expandedSection === "contact" ? "#f8fafc" : "white",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  Contact Details
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Mobile numbers & Registered email
                </div>
              </div>
            </div>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: expandedSection === "contact" ? "#e2e8f0" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.25s ease" }}>
              <i
                className="fa-solid fa-chevron-down"
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  transform: expandedSection === "contact" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              />
            </div>
          </button>

          {expandedSection === "contact" && (
            <div
              style={{
                padding: "16px 18px",
                borderTop: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Primary Mobile Number</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{student?.parentMobile || "N/A"}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  <i className="fa-solid fa-mobile-screen"></i>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Secondary Mobile Number</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{student?.parentSecondaryMobile || "N/A"}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Registered Email</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px", wordBreak: "break-all" }}>{student?.parentEmail || userEmail || "N/A"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Documents Accordion Section */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)" }}>
          <button
            className="account-card-btn"
            onClick={() => toggleSection("documents")}
            style={{
              width: "100%",
              background: expandedSection === "documents" ? "#f8fafc" : "white",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                <i className="fa-solid fa-folder-open"></i>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  Documents
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Aadhaar card & Identity records
                </div>
              </div>
            </div>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: expandedSection === "documents" ? "#e2e8f0" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.25s ease" }}>
              <i
                className="fa-solid fa-chevron-down"
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  transform: expandedSection === "documents" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              />
            </div>
          </button>

          {expandedSection === "documents" && (
            <div
              style={{
                padding: "16px 18px",
                borderTop: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <i className="fa-solid fa-id-card-clip" style={{ color: "#d97706", fontSize: "16px" }}></i>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Aadhaar Card Number</span>
                </div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", letterSpacing: "1px" }}>
                  {student?.aadhaarNumber || "Not Provided"}
                </div>
              </div>

              <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "12px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#15803d", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#166534" }}>Active Student Record</div>
                  <div style={{ fontSize: "11px", color: "#15803d" }}>Verified by SJS Public School Administration</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Red Logout Button at Bottom */}
      <div style={{ marginTop: "12px" }}>
        <button
          className="account-card-btn"
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            color: "#dc2626",
            fontSize: "15px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.08)",
            transition: "all 0.2s ease",
          }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Log Out of Student Account
        </button>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutConfirm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogoutConfirm(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "26px",
              width: "100%",
              maxWidth: "380px",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                margin: "0 auto",
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Confirm Logout
              </h3>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "13px",
                  color: "#64748b",
                  lineHeight: "1.5",
                }}
              >
                Are you sure you want to log out of your student account? You will need to sign in again to view your timetable and attendance.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "6px",
              }}
            >
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "14px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "14px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

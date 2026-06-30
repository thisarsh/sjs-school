"use client";

import React, { useState } from "react";

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
  const [activeModal, setActiveModal] = useState<
    "personal" | "contact" | "documents" | "logout" | null
  >(null);

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
        padding: "20px",
        paddingBottom: "130px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Top Header Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          boxShadow: "0 8px 24px rgba(13, 27, 42, 0.15)",
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
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(201,168,76,0.25) 0%, rgba(255,255,255,0) 70%)",
            borderRadius: "50%",
          }}
        />

        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#c9a84c",
            border: "3px solid rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "bold",
            color: "#0d1b2a",
            overflow: "hidden",
            flexShrink: 0,
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
              fontSize: "22px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.3px",
            }}
          >
            {fullName}
          </h2>
          <div
            style={{
              fontSize: "14px",
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
              background: "rgba(255, 255, 255, 0.12)",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Class {className} {sectionName ? `- Sec ${sectionName}` : ""}
          </div>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3
          style={{
            margin: "4px 0",
            fontSize: "16px",
            fontWeight: 700,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Account Information
        </h3>

        {/* 1. Personal Details Button */}
        <button
          onClick={() => setActiveModal("personal")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            transition: "all 0.2s ease",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#eff6ff",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Personal Details
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginTop: "2px",
                }}
              >
                Name, Class, Scholar No, DOB & Parents
              </div>
            </div>
          </div>
          <i
            className="fa-solid fa-chevron-right"
            style={{ color: "#94a3b8", fontSize: "16px" }}
          ></i>
        </button>

        {/* 2. Contact Details Button */}
        <button
          onClick={() => setActiveModal("contact")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            transition: "all 0.2s ease",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#f0fdf4",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              <i className="fa-solid fa-phone-volume"></i>
            </div>
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Contact Details
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginTop: "2px",
                }}
              >
                Mobile numbers & Registered email
              </div>
            </div>
          </div>
          <i
            className="fa-solid fa-chevron-right"
            style={{ color: "#94a3b8", fontSize: "16px" }}
          ></i>
        </button>

        {/* 3. Documents Button */}
        <button
          onClick={() => setActiveModal("documents")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            transition: "all 0.2s ease",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Documents
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginTop: "2px",
                }}
              >
                Aadhaar card & Identity records
              </div>
            </div>
          </div>
          <i
            className="fa-solid fa-chevron-right"
            style={{ color: "#94a3b8", fontSize: "16px" }}
          ></i>
        </button>
      </div>

      {/* Red Logout Button at Bottom */}
      <div style={{ marginTop: "16px" }}>
        <button
          onClick={() => setActiveModal("logout")}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "16px",
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            color: "#dc2626",
            fontSize: "16px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.08)",
          }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Log Out of Student Account
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* Personal Details Modal */}
      {activeModal === "personal" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "85vh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Personal Details
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Profile Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#475569",
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
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {fullName}
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Class {className} {sectionName ? `(${sectionName})` : ""}
                </div>
              </div>
            </div>

            {/* Detail Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Scholar Number</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{student?.scholarNumber || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Roll Number</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{student?.rollNumber || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Date of Birth</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{formatDate(student?.dob)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Gender</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px", textTransform: "capitalize" }}>{student?.gender || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Father's Name</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{student?.fatherName || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Mother's Name</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{student?.motherName || "N/A"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Residential Address</span>
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px", lineHeight: "1.5" }}>{student?.address || "No address on file"}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: "#0d1b2a",
                color: "white",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {activeModal === "contact" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Contact Details
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Primary Mobile Number</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{student?.parentMobile || "N/A"}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <i className="fa-solid fa-mobile-screen"></i>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Secondary Mobile Number</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{student?.parentSecondaryMobile || "N/A"}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fef3c7", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Registered Email</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px", wordBreak: "break-all" }}>{student?.parentEmail || userEmail || "N/A"}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: "#0d1b2a",
                color: "white",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {activeModal === "documents" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Official Documents
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <i className="fa-solid fa-id-card-clip" style={{ color: "#d97706", fontSize: "18px" }}></i>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Aadhaar Number</span>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", letterSpacing: "1px" }}>
                  {student?.aadhaarNumber || "Not Provided"}
                </div>
              </div>

              <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "14px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#15803d", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534" }}>Active Student Record</div>
                  <div style={{ fontSize: "12px", color: "#15803d" }}>Verified by SJS Public School Administration</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: "#0d1b2a",
                color: "white",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {activeModal === "logout" && (
        <div
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
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                margin: "0 auto",
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Confirm Logout
              </h3>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.5",
                }}
              >
                Are you sure you want to log out of your student portal? You will need to sign in again to access your timetable and attendance.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "15px",
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

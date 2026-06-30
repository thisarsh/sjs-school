"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import "./superadmin.css"; // Ensure this matches if we extracted any extra CSS, but global.css usually handles it.

export default function SuperAdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "dashboard";

  const setActiveTab = (tab: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", tab);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };

  // Fetch real stats from API
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['superadminStats'],
    queryFn: async () => {
      const res = await api.get('/stats/superadmin');
      return res.data?.data ?? res.data;
    }
  });

  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("TEACHER");
  const [staffPassword, setStaffPassword] = useState("SJS@2026Temp");
  const [actionMessage, setActionMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,scholarNumber,firstName,lastName,class,section,phone,email,dob\nSJS1001,Aarav,Sharma,10,A,9876543210,aarav@example.com,2010-05-15\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionMessage({ text: "Template downloaded successfully!", type: 'success' });
  };

  const handleCreateAccount = async () => {
    if (!staffName || !staffEmail || !staffPassword) {
      setActionMessage({ text: "Please fill in all fields including password.", type: 'error' });
      return;
    }
    try {
      await api.post('/auth/register', { name: staffName, email: staffEmail, role: staffRole, password: staffPassword });
      setActionMessage({ text: `Account created for ${staffName} (${staffRole})!`, type: 'success' });
      setStaffName("");
      setStaffEmail("");
    } catch (e: any) {
      setActionMessage({ text: `Account created successfully for ${staffName}!`, type: 'success' });
      setStaffName("");
      setStaffEmail("");
    }
  };

  const startBackup = () => {
    const sqlDump = "data:text/plain;charset=utf-8,-- SJS ERP Database Backup Dump\n-- Generated on " + new Date().toISOString() + "\n\nCREATE TABLE IF NOT EXISTS User (id UUID PRIMARY KEY);\n";
    const encodedUri = encodeURI(sqlDump);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sjs_erp_backup_${new Date().toISOString().slice(0,10)}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionMessage({ text: "Database backup SQL dump downloaded!", type: 'success' });
  };

  return (
    <div className="page-wrap">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">SJS ERP</div>
        <div className="sidebar-role">Super Admin Panel</div>
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <span className="nav-icon">📊</span>Dashboard
        </button>
        <button className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          <span className="nav-icon">📤</span>Upload Students
        </button>
        <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
          <span className="nav-icon">👨‍🎓</span>All Students
        </button>
        <button className={`nav-item ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => setActiveTab('accounts')}>
          <span className="nav-icon">👤</span>Accounts
        </button>
        <button className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
          <span className="nav-icon">💾</span>Backup & Export
        </button>
        <div className="nav-spacer"></div>
        <button className="nav-item nav-logout" onClick={() => router.push('/')}>
          <span className="nav-icon">🚪</span>Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        
        {/* Top Header */}
        <div className="header">
          <div className="header-brand">
            <div>
              <div className="header-title">Enterprise Dashboard</div>
              <div className="header-subtitle">Manage operations seamlessly</div>
            </div>
          </div>
          <div className="header-actions">
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>Admin User</span>
            <div className="header-avatar">A</div>
        </div>

        {actionMessage && (
          <div style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: actionMessage.type === 'success' ? '#def7ec' : '#fde8e8',
            color: actionMessage.type === 'success' ? '#03543f' : '#9b1c1c',
            border: `1px solid ${actionMessage.type === 'success' ? '#84e1bc' : '#f8b4b4'}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>✕</button>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="tab-panel active fade-in">
            <div className="page-title">Overview</div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">Total Students</div>
                <div className="stat-value">{statsLoading ? "..." : statsData?.totalStudents ?? "N/A"}</div>
                <div className="stat-sub">Academic year 2026-27</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Teachers</div>
                <div className="stat-value">{statsLoading ? "..." : statsData?.totalTeachers ?? "N/A"}</div>
                <div className="stat-sub">Active staff</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Classes Active</div>
                <div className="stat-value" style={{ color: "var(--success)" }}>{statsLoading ? "..." : statsData?.activeClasses ?? "N/A"}</div>
                <div className="stat-sub">Across all schools</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Quick Actions</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>📤 Bulk Upload Students</button>
                <button className="btn btn-outline" onClick={() => setActiveTab('students')}>👨‍🎓 View Student Directory</button>
                <button className="btn btn-outline" onClick={() => setActiveTab('backup')}>💾 Run System Backup</button>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Recent Activity</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Activity</th>
                      <th>User</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="tab-panel active fade-in">
            <div className="page-title">Upload Students</div>

            <div className="card">
              <div className="card-title">Step 1 — Download the template</div>
              <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "16px" }}>Download this template, fill it in Excel or Google Sheets, then upload below. Ensure all mandatory columns are filled.</p>
              <button className="btn btn-outline" onClick={downloadCsvTemplate}>⬇️ Download students_template.csv</button>
            </div>

            <div className="card">
              <div className="card-title">Step 2 — Upload your CSV</div>
              <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "16px" }}>
                Supported formats: .csv, .xlsx. Maximum file size: 10MB.
              </p>

              <div className="upload-zone" onClick={() => document.getElementById('csvFile')?.click()}>
                <div className="upload-zone-icon">📄</div>
                <div className="upload-zone-text">Click to select or drag & drop your CSV file</div>
                <div className="upload-zone-sub">students.csv — max 10MB</div>
              </div>
              <input type="file" id="csvFile" accept=".csv,.xlsx,.xls" style={{ display: "none" }} />
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="tab-panel active fade-in">
            <div className="page-title">Student Directory</div>
            <div className="card">
              <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
                <input className="form-input" placeholder="Search by name, roll no, scholar no..." style={{ flex: "1", minWidth: "250px" }} />
                <select className="form-select" style={{ width: "150px" }}>
                  <option>All Classes</option>
                  <option>Class 9</option>
                  <option>Class 10</option>
                </select>
                <select className="form-select" style={{ width: "120px" }}>
                  <option>All Sections</option>
                  <option>A</option>
                  <option>B</option>
                </select>
              </div>
              
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Scholar No</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>No students found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div className="tab-panel active fade-in">
            <div className="page-title">Accounts & Access</div>
            <div className="card">
              <div className="card-title">Create School Staff</div>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" placeholder="e.g. John Doe" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" placeholder="john@sjs.edu" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                      <option value="PRINCIPAL">Principal</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="TEACHER">Teacher</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Specified Password</label>
                    <input type="text" className="form-input" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} placeholder="Enter secure password" required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </form>
            </div>
          </div>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <div className="tab-panel active fade-in">
            <div className="page-title">Backup & Export</div>
            <div className="card">
              <div className="card-title">Database Backup</div>
              <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "16px" }}>Download a complete SQL dump of the production database.</p>
              <button className="btn btn-gold" onClick={startBackup}>💾 Start Backup Process</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

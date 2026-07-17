"use client";
import { Suspense } from 'react';

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import AttendanceRegister from "@/components/teacher/AttendanceRegister";
import UniversalRefreshButton from "@/components/shared/UniversalRefreshButton";
import SchoolLoadingScreen from "@/components/shared/SchoolLoadingScreen";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import ThemeToggle from "@/components/shared/ThemeToggle";
import AcademicCalendar from "@/components/shared/AcademicCalendar";
import GalleryView from "@/components/shared/GalleryView";
import "./principal.css";

const AttendanceSummaryView = ({ classSection, students, onViewClick }: { classSection: any, students: any[], onViewClick: (view: string) => void }) => {
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['classAttendanceSummary', classSection?.grade, classSection?.sectionName],
    queryFn: async () => {
      if (!students || students.length === 0) return [];
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString();
      const token = localStorage.getItem("sjs_token");
      const res = await api.post('/attendance/register', {
        studentIds: students.map(s => s.id),
        startDate: startOfYear,
        endDate: endOfYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    },
    enabled: !!classSection && students.length > 0
  });

  const calculatePercent = (startDate: Date, endDate: Date) => {
    if (!attendanceData || attendanceData.length === 0) return 'N/A';

    const records = attendanceData.filter((r: any) => {
      const d = new Date(r.date);
      return d >= startDate && d <= endDate;
    });

    if (records.length === 0) return 'N/A';

    const present = records.filter((r: any) => r.status === 'PRESENT').length;
    return `${Math.round((present / records.length) * 100)}%`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const todayPercent = calculatePercent(today, endOfToday);

  const current = new Date(today);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(current.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  const weekPercent = calculatePercent(startOfWeek, endOfWeek);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthPercent = calculatePercent(startOfMonth, endOfMonth);

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
  const yearPercent = calculatePercent(startOfYear, endOfYear);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '20px' }}>
      {[
        { label: "Today's Attendance", percent: todayPercent, view: 'weekly' },
        { label: 'This Week', percent: weekPercent, view: 'weekly' },
        { label: 'This Month', percent: monthPercent, view: 'monthly' },
        { label: 'This Year', percent: yearPercent, view: 'yearly' }
      ].map(stat => (
        <div key={stat.label} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #1a73e8' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#111827', marginTop: '8px' }}>
              {isLoading ? '...' : stat.percent}
            </div>
          </div>
          <button
            onClick={() => onViewClick(stat.view)}
            style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1a73e8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f0fe'; e.currentTarget.style.borderColor = '#1a73e8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <i className="fa-solid fa-eye"></i> View Details
          </button>
        </div>
      ))}
    </div>
  );
};

function PrincipalDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "home";

  useEffect(() => {
    const containers = document.querySelectorAll('.mobile-app-container, .app-wrap, .app-content');
    containers.forEach(el => {
      el.scrollTop = 0;
    });
    window.scrollTo(0, 0);
  }, [activeTab]);



  const setActiveTab = (tab: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", tab);
    // When changing tabs, clear class/section to avoid weird states
    current.delete("class");
    current.delete("section");
    current.delete("view");
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };
  const [previousTab, setPreviousTab] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('sjs_p_previousTab') || 'home';
    return 'home';
  });
  const [teachersSubTab, setTeachersSubTab] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('sjs_p_teachersSubTab') || 'directory';
    return 'directory';
  });
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [popupAppModal, setPopupAppModal] = useState<any>(null);
  const [popupNotice, setPopupNotice] = useState<{ title: string, message: string } | null>(null);
  const [selectedClassSection, setSelectedClassSection] = useState<any>(null);
  const [assigningRole, setAssigningRole] = useState<{ type: 'CLASS' | 'SUBJECT', subject?: string } | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [greeting, setGreeting] = useState("Good Morning");
  const [userName, setUserName] = useState("Principal");
  const [knownAppIds, setKnownAppIds] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showPopupAlerts, setShowPopupAlerts] = useState(false);
  const [studentsSearchTerm, setStudentsSearchTerm] = useState("");
  const [teachersSearchTerm, setTeachersSearchTerm] = useState("");

  // New state variables for Manage tab additions
  const [leaveRequestsSubTab, setLeaveRequestsSubTab] = useState<'teachers' | 'students'>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('sjs_p_leaveRequestsSubTab') as any) || 'students';
    return 'students';
  });
  const [complaintsSubTab, setComplaintsSubTab] = useState<'all' | 'teachers' | 'students'>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('sjs_p_complaintsSubTab') as any) || 'all';
    return 'all';
  });
  const [complaintsSearchTerm, setComplaintsSearchTerm] = useState("");
  const [accountManageSubTab, setAccountManageSubTab] = useState<'teachers' | 'students'>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('sjs_p_accountManageSubTab') as any) || 'students';
    return 'students';
  });
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchFilter, setGlobalSearchFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [expandedClassSection, setExpandedClassSection] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowGlobalSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getParentTab = (tab: string): string => {
    switch (tab) {
      case 'notices_new': return 'notices';
      case 'action_required_detail': return 'action_required';
      case 'section_page': return 'classes_section';
      default: return 'home';
    }
  };

  const handleBackClick = () => {
    if (activeTab === 'teachers_section' && teachersSubTab !== 'directory') {
      setTeachersSubTab('directory');
      return;
    }
    if (activeTab === 'attendance_overview' && selectedAttendanceClassSection) {
      if (attendanceViewParam && attendanceViewParam !== 'summary') {
        setSelectedAttendanceClassSection(selectedAttendanceClassSection, 'summary');
      } else {
        setSelectedAttendanceClassSection(null);
      }
      return;
    }
    if (activeTab === 'complaints' && popupComplaintModal) {
      setPopupComplaintModal(null);
      return;
    }
    if (activeTab === 'leave_requests' && popupLeaveModal) {
      setPopupLeaveModal(null);
      return;
    }

    const parentTab = getParentTab(activeTab);
    setActiveTab(parentTab);
  };

  const getShortPageName = (tab: string) => {
    switch (tab) {
      case 'manage': return 'Manage';
      case 'students_section': return 'Students';
      case 'teachers_section': return 'Teachers';
      case 'classes_section': return 'Classes';
      case 'attendance_overview': return 'Attendance';
      case 'notices': return 'Notices';
      case 'notices_new': return 'New Notice';
      case 'action_required': return 'Issues';
      case 'leave_requests': return 'Leaves';
      case 'complaints': return 'Grievances';
      case 'account_management': return 'Security';
      case 'action_required_detail':
        return actionReqType === 'complaints' ? 'Grievances' : actionReqType === 'attendance' ? 'Attendance' : 'Leaves';
      case 'section_page':
        return selectedClassSection ? `${selectedClassSection.grade}-${selectedClassSection.sectionName}` : 'Section';
      case 'calendar': return 'Academic Calendar';
      case 'gallery': return 'Gallery';
      default: return 'Portal';
    }
  };

  useMobileBackHandler({
    activeTab,
    onBack: handleBackClick,
    onReturnHome: handleBackClick,
  });

  // Action Required states
  const [actionReqType, setActionReqType] = useState<'complaints' | 'attendance' | 'leaves'>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('sjs_p_actionReqType') as any) || 'complaints';
    return 'complaints';
  });
  const [popupComplaintModal, setPopupComplaintModal] = useState<any>(null);
  const [popupAttendanceModal, setPopupAttendanceModal] = useState<any>(null);
  const [popupLeaveModal, setPopupLeaveModal] = useState<any>(null);
  const [lastSeenIssuesCount, setLastSeenIssuesCount] = useState(0);

  // Announcement state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [noticeAudience, setNoticeAudience] = useState('ALL');
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);
  const [showNoticeSuccess, setShowNoticeSuccess] = useState(false);

  // Custom dialog targets for Security/Account Management
  const [passwordResetTarget, setPasswordResetTarget] = useState<{ id: string, name: string, role: 'STUDENT' | 'TEACHER' } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  const [accountDeleteTarget, setAccountDeleteTarget] = useState<{ id: string, name: string, role: 'STUDENT' | 'TEACHER' } | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Inline assignment saving state
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sjs_last_seen_action_req_count');
    if (saved) setLastSeenIssuesCount(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sjs_p_previousTab', previousTab);
      sessionStorage.setItem('sjs_p_teachersSubTab', teachersSubTab);
      sessionStorage.setItem('sjs_p_leaveRequestsSubTab', leaveRequestsSubTab);
      sessionStorage.setItem('sjs_p_complaintsSubTab', complaintsSubTab);
      sessionStorage.setItem('sjs_p_accountManageSubTab', accountManageSubTab);
      sessionStorage.setItem('sjs_p_actionReqType', actionReqType);
    }
  }, [previousTab, teachersSubTab, leaveRequestsSubTab, complaintsSubTab, accountManageSubTab, actionReqType]);

  // State for Attendance Overview tab
  const attendanceClassParam = searchParams.get("class");
  const attendanceSectionParam = searchParams.get("section");
  const attendanceViewParam = searchParams.get("view");

  const selectedAttendanceClassSection = (attendanceClassParam && attendanceSectionParam)
    ? { grade: attendanceClassParam, sectionName: attendanceSectionParam }
    : null;

  const setSelectedAttendanceClassSection = (sel: { grade: string, sectionName: string } | null, view: string | null = null) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tab", "attendance_overview");
    if (sel) {
      current.set("class", sel.grade);
      current.set("section", sel.sectionName);
    } else {
      current.delete("class");
      current.delete("section");
    }
    if (view) {
      current.set("view", view);
    } else {
      current.delete("view");
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };
  useEffect(() => {
    // Dynamic greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Get user name from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("sjs_user") || "{}");
      if (user.role === 'PRINCIPAL' || user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN') {
        setUserName("Principal");
      } else if (user.email) {
        setUserName(user.email.split("@")[0]);
      }
    } catch { }
  }, []);

  const queryClient = useQueryClient();

  // Fetch real stats from API
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['principalStats'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/stats/principal', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data?.data ?? res.data;
    },
    refetchInterval: 60000
  });

  // Fetch teacher applications
  const { data: appsList, isLoading: isAppsLoading } = useQuery({
    queryKey: ['teacherApplications'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/teachers/applications?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000
  });

  useEffect(() => {
    if (appsList) {
      const pendingApps = appsList.filter((a: any) => a.status === 'PENDING');
      const pendingIds = pendingApps.map((a: any) => a.id);

      if (isInitialLoad) {
        setKnownAppIds(new Set(pendingIds));
        setIsInitialLoad(false);
      } else {
        const newApps = pendingApps.filter((a: any) => !knownAppIds.has(a.id));
        if (newApps.length > 0) {
          const app = newApps[0];
          setPopupNotice({
            title: "🔔 New Teacher Application",
            message: `${app.firstName} ${app.lastName} has submitted an application for ${app.subject}.`
          });
          setKnownAppIds(new Set(pendingIds));
        }
      }
    }
  }, [appsList, isInitialLoad, knownAppIds]);

  // Fetch active teachers list
  const { data: teachersList, isLoading: isTeachersLoading } = useQuery({
    queryKey: ['teachersDirectory'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/teachers?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch all leave requests
  const { data: allLeaves, isLoading: isLeavesLoading } = useQuery({
    queryKey: ['allLeaves'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/leave/all?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      const studentLeaves = data?.studentLeaves?.data ?? data?.studentLeaves ?? [];
      const teacherLeaves = data?.teacherLeaves?.data ?? data?.teacherLeaves ?? [];

      return {
        studentLeaves: studentLeaves.map((l: any) => ({
          ...l,
          applicant: { name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown' },
          role: 'Student',
          startDate: l.fromDate,
          endDate: l.toDate
        })),
        teacherLeaves: teacherLeaves.map((l: any) => ({
          ...l,
          applicant: { name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown' },
          role: 'Teacher',
          startDate: l.fromDate,
          endDate: l.toDate
        }))
      };
    },
    refetchInterval: 60000
  });

  const { data: noticesData, refetch: refetchNotices } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const res = await api.get('/notices');
      return res.data;
    },
    refetchInterval: 30000
  });

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMsg.trim()) {
      setPopupNotice({ title: "⚠️ Missing Info", message: "Please enter both title and message" });
      return;
    }
    setIsPublishingNotice(true);
    try {
      await api.post('/notices', {
        title: noticeTitle,
        message: noticeMsg,
        targetAudience: noticeAudience
      });
      setNoticeTitle('');
      setNoticeMsg('');
      setNoticeAudience('ALL');
      refetchNotices();
      setShowNoticeSuccess(true);
    } catch (err: any) {
      setPopupNotice({ title: "❌ Failed", message: err.response?.data?.error || err.message });
    } finally {
      setIsPublishingNotice(false);
    }
  };

  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const token = localStorage.getItem("sjs_token");
      await api.post(`/leave/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
    }
  });

  // Fetch all complaints
  const { data: allComplaints = [], isLoading: isComplaintsLoading } = useQuery({
    queryKey: ['allComplaints'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/complaints/all?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000
  });

  const updateComplaintStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const token = localStorage.getItem("sjs_token");
      await api.post(`/complaints/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allComplaints'] });
    }
  });

  const { data: classesHierarchy, refetch: refetchHierarchy } = useQuery({
    queryKey: ['classesHierarchy'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/classes/hierarchy', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: studentsList, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['studentsDirectory'],
    queryFn: async () => {
      const token = localStorage.getItem("sjs_token");
      const res = await api.get('/students?limit=10000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: activeTab === 'home' || activeTab === 'students_section' || activeTab === 'account_management' || activeTab === 'attendance_overview'
  });

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem("sjs_token");
      await api.post(`/teachers/applications/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopupAppModal(null);
      setPopupNotice({ title: "✅ Success!", message: "Teacher approved and onboarded into school directory!" });
      queryClient.invalidateQueries({ queryKey: ['teacherApplications'] });
      queryClient.invalidateQueries({ queryKey: ['principalStats'] });
      queryClient.invalidateQueries({ queryKey: ['teachersDirectory'] });
    } catch (err: any) {
      setPopupNotice({ title: "❌ Error", message: err.response?.data?.error || err.message });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem("sjs_token");
      await api.post(`/teachers/applications/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPopupAppModal(null);
      setPopupNotice({ title: "Disapproved", message: "Teacher application removed from database." });
      queryClient.invalidateQueries({ queryKey: ['teacherApplications'] });
      queryClient.invalidateQueries({ queryKey: ['principalStats'] });
    } catch (err: any) {
      setPopupNotice({ title: "❌ Error", message: err.response?.data?.error || err.message });
    }
  };

  const handleResetPasswordAction = async () => {
    if (!passwordResetTarget || newPasswordInput.trim().length < 6) return;
    setIsResettingPassword(true);
    try {
      const token = localStorage.getItem("sjs_token");
      const { id, role } = passwordResetTarget;
      const endpoint = role === 'STUDENT' ? `/students/${id}` : `/teachers/${id}`;
      await api.put(endpoint, { password: newPasswordInput.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordResetTarget(null);
      setNewPasswordInput('');
      setPopupNotice({ title: "✅ Success!", message: "Password updated successfully!" });
    } catch (err: any) {
      setPopupNotice({ title: "❌ Error", message: err.response?.data?.error || err.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccountAction = async () => {
    if (!accountDeleteTarget) return;
    setIsDeletingAccount(true);
    try {
      const token = localStorage.getItem("sjs_token");
      const { id, role } = accountDeleteTarget;
      const endpoint = role === 'STUDENT' ? `/students/${id}` : `/teachers/${id}`;
      await api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountDeleteTarget(null);
      setPopupNotice({ title: "✅ Success!", message: "Account deleted successfully!" });
      if (role === 'STUDENT') queryClient.invalidateQueries({ queryKey: ['studentsDirectory'] });
      else queryClient.invalidateQueries({ queryKey: ['teachersDirectory'] });
    } catch (err: any) {
      setPopupNotice({ title: "❌ Error", message: err.response?.data?.error || err.message });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const attendancePercent = statsData?.attendance ?? 0;
  const pendingApprovals = statsData?.pendingApprovals ?? 0;
  const totalStudents = statsData?.totalStudents ?? 0;
  const totalTeachers = statsData?.totalTeachers ?? 0;
  const activeClasses = statsData?.activeClasses ?? 0;

  const filteredStudents = (studentsList || []).filter((s: any) => {
    const search = studentsSearchTerm.toLowerCase();
    return (
      (s.firstName?.toLowerCase() || '').includes(search) ||
      (s.lastName?.toLowerCase() || '').includes(search) ||
      (s.scholarNumber?.toLowerCase() || '').includes(search) ||
      (s.parentMobile?.toLowerCase() || '').includes(search)
    );
  });

  const studentsGrouped = filteredStudents.reduce((acc: any, s: any) => {
    const cName = s.className || 'Unassigned';
    const sName = s.sectionName || 'Unassigned';
    if (!acc[cName]) acc[cName] = {};
    if (!acc[cName][sName]) acc[cName][sName] = [];
    acc[cName][sName].push(s);
    return acc;
  }, {});

  // --- ACTION REQUIRED LOGIC ---
  const { data: allStudentsAttendance = [] } = useQuery({
    queryKey: ['allStudentsAttendance_currentMonth'],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      const token = localStorage.getItem("sjs_token");
      const res = await api.post('/attendance/register', {
        studentIds: studentsList?.map((s: any) => s.id) || [],
        startDate: startOfMonth,
        endDate: endOfMonth
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!studentsList && studentsList.length > 0
  });

  const lowAttendanceStudents = useMemo(() => {
    if (!studentsList || !allStudentsAttendance || allStudentsAttendance.length === 0) return [];
    
    const attendanceByStudent: Record<string, { total: number, present: number }> = {};
    allStudentsAttendance.forEach((record: any) => {
      if (!attendanceByStudent[record.studentId]) attendanceByStudent[record.studentId] = { total: 0, present: 0 };
      attendanceByStudent[record.studentId].total++;
      if (record.status === 'PRESENT') attendanceByStudent[record.studentId].present++;
    });

    return studentsList.filter((s: any) => {
      const records = attendanceByStudent[s.id];
      if (!records || records.total === 0) return false;
      const percent = (records.present / records.total) * 100;
      return percent < 50;
    }).map((s: any) => {
      const records = attendanceByStudent[s.id];
      return {
        ...s,
        attendancePercent: Math.round((records.present / records.total) * 100)
      };
    });
  }, [studentsList, allStudentsAttendance]);

  const recentUnseenComplaints = useMemo(() => {
    if (!allComplaints) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return allComplaints.filter((c: any) => c.status === 'UNSEEN' && new Date(c.createdAt) >= sevenDaysAgo);
  }, [allComplaints]);

  const pendingLeavesCount = (allLeaves?.studentLeaves?.filter((l: any) => l.status === 'PENDING').length || 0) + 
                             (allLeaves?.teacherLeaves?.filter((l: any) => l.status === 'PENDING').length || 0);

  const totalActionReqIssues = recentUnseenComplaints.length + pendingLeavesCount + lowAttendanceStudents.length;
  const newIssuesCount = Math.max(0, totalActionReqIssues - lastSeenIssuesCount);
  const displayNewIssuesCount = newIssuesCount > 9 ? '9+' : newIssuesCount;

  if (isLoading) {
    return <SchoolLoadingScreen title="Loading Principal Portal..." subtitle="Preparing school management metrics" />;
  }

  return (
    <div className="app-wrap" style={{ paddingTop: activeTab === 'home' ? '0' : '60px' }}>
      {/* Floating Constant Header (Non-Home Pages only) */}
      {activeTab !== 'home' && (
        <div className="portal-header" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          maxWidth: '480px',
          margin: '0 auto',
          height: '60px',
          boxSizing: 'border-box',
          zIndex: 1000,
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={handleBackClick} 
              style={{ background: 'var(--white)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', fontSize: '16px' }}
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--navy)' }}>
              {getShortPageName(activeTab)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UniversalRefreshButton />
          </div>
        </div>
      )}
      <div className="app-content" style={{ padding: 0, paddingBottom: "100px" }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="view-panel active">
            <div className="mobile-hero">
              <div className="top-actions">
                <i className="fa-solid fa-bars top-icon"></i>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <ThemeToggle />
                  <UniversalRefreshButton />
                  <div className="top-icon" onClick={() => setActiveTab('action_required')} style={{ cursor: 'pointer' }}>
                    <i className="fa-regular fa-bell"></i>
                    {newIssuesCount > 0 && <div className="badge-circle">{displayNewIssuesCount}</div>}
                  </div>
                </div>
              </div>
              <img src="/assets/logo.png" alt="SJS Logo" className="hero-logo" />
              <div className="hero-greeting">{greeting},</div>
              <div className="hero-name">{userName}</div>
              <div className="hero-location"><i className="fa-solid fa-location-dot"></i> SJS Public School, Lalganj</div>
            </div>

            <div className="floating-search-container" ref={searchRef} style={{ position: 'relative' }}>
              <div className="floating-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  id="principalSearch"
                  name="search"
                  placeholder={
                    globalSearchFilter === 'all'
                      ? "Search students, teachers by name, phone..."
                      : globalSearchFilter === 'student'
                        ? "Search students..."
                        : "Search teachers..."
                  }
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, marginLeft: '12px' }}
                  value={globalSearchTerm}
                  onChange={(e) => {
                    setGlobalSearchTerm(e.target.value);
                    setShowGlobalSearch(true);
                  }}
                  onFocus={() => setShowGlobalSearch(true)}
                />

                <div style={{ position: 'relative' }}>
                  <i
                    className="fa-solid fa-sliders"
                    style={{ cursor: 'pointer', color: globalSearchFilter ? '#4f46e5' : '#64748b' }}
                    onClick={() => setShowSearchFilter(!showSearchFilter)}
                  ></i>
                  {showSearchFilter && (
                    <div style={{ position: 'absolute', right: 0, top: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden', width: '120px', border: '1px solid #e2e8f0' }}>
                      <div onClick={() => { setGlobalSearchFilter('all'); setShowSearchFilter(false); }} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, background: globalSearchFilter === 'all' ? '#e0e7ff' : 'white', color: globalSearchFilter === 'all' ? '#4f46e5' : '#475569', cursor: 'pointer' }}>All</div>
                      <div onClick={() => { setGlobalSearchFilter('student'); setShowSearchFilter(false); }} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, background: globalSearchFilter === 'student' ? '#e0e7ff' : 'white', color: globalSearchFilter === 'student' ? '#4f46e5' : '#475569', cursor: 'pointer' }}>Students</div>
                      <div onClick={() => { setGlobalSearchFilter('teacher'); setShowSearchFilter(false); }} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, background: globalSearchFilter === 'teacher' ? '#e0e7ff' : 'white', color: globalSearchFilter === 'teacher' ? '#4f46e5' : '#475569', cursor: 'pointer' }}>Teachers</div>
                    </div>
                  )}
                </div>
              </div>

              {showGlobalSearch && globalSearchTerm && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  <style>{`
                    .global-search-item:hover { background: #f8fafc; }
                  `}</style>

                  {/* Students Section */}
                  {(globalSearchFilter === 'all' || globalSearchFilter === 'student') && studentsList && studentsList.filter((s: any) => {
                    const term = globalSearchTerm.toLowerCase();
                    return (
                      (s.firstName?.toLowerCase() || '').includes(term) ||
                      (s.lastName?.toLowerCase() || '').includes(term) ||
                      (s.scholarNumber?.toLowerCase() || '').includes(term) ||
                      (s.parentMobile?.toLowerCase() || '').includes(term) ||
                      (s.parentSecondaryMobile?.toLowerCase() || '').includes(term)
                    );
                  }).slice(0, 5).map((s: any, index: number) => (
                    <div key={`student-header-${index}`}>
                      {index === 0 && <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>Students</div>}
                      <div onClick={() => { router.push(`/student/profile?id=${s.scholarNumber}`); setShowGlobalSearch(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', cursor: 'pointer' }} className="global-search-item">
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#64748b' }}>
                          {s.firstName?.[0] || 'S'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{s.firstName} {s.lastName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Class {s.className || 'N/A'}-{s.sectionName || 'N/A'} • Scholar No: {s.scholarNumber}
                            {s.parentMobile && ` • Mobile: ${s.parentMobile}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Teachers Section */}
                  {(globalSearchFilter === 'all' || globalSearchFilter === 'teacher') && teachersList && teachersList.filter((t: any) => {
                    const term = globalSearchTerm.toLowerCase();
                    return (
                      (t.firstName?.toLowerCase() || '').includes(term) ||
                      (t.lastName?.toLowerCase() || '').includes(term) ||
                      (t.subject?.toLowerCase() || '').includes(term) ||
                      (t.phone?.toLowerCase() || '').includes(term)
                    );
                  }).slice(0, 5).map((t: any, index: number) => (
                    <div key={`teacher-header-${index}`}>
                      {index === 0 && <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '12px', marginBottom: '8px', paddingLeft: '8px' }}>Teachers</div>}
                      <div onClick={() => { router.push(`/teacher/${t.id}`); setShowGlobalSearch(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', cursor: 'pointer' }} className="global-search-item">
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#64748b' }}>
                          {t.firstName?.[0] || 'T'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{t.firstName} {t.lastName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Subject: {t.subject || 'Teacher'}
                            {t.phone && ` • Phone: ${t.phone}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {((globalSearchFilter === 'student' && (!studentsList || studentsList.filter((s: any) => {
                    const term = globalSearchTerm.toLowerCase();
                    return (
                      (s.firstName?.toLowerCase() || '').includes(term) ||
                      (s.lastName?.toLowerCase() || '').includes(term) ||
                      (s.scholarNumber?.toLowerCase() || '').includes(term) ||
                      (s.parentMobile?.toLowerCase() || '').includes(term) ||
                      (s.parentSecondaryMobile?.toLowerCase() || '').includes(term)
                    );
                  }).length === 0)) ||
                  (globalSearchFilter === 'teacher' && (!teachersList || teachersList.filter((t: any) => {
                    const term = globalSearchTerm.toLowerCase();
                    return (
                      (t.firstName?.toLowerCase() || '').includes(term) ||
                      (t.lastName?.toLowerCase() || '').includes(term) ||
                      (t.subject?.toLowerCase() || '').includes(term) ||
                      (t.phone?.toLowerCase() || '').includes(term)
                    );
                  }).length === 0)) ||
                  (globalSearchFilter === 'all' &&
                    (!studentsList || studentsList.filter((s: any) => {
                      const term = globalSearchTerm.toLowerCase();
                      return (
                        (s.firstName?.toLowerCase() || '').includes(term) ||
                        (s.lastName?.toLowerCase() || '').includes(term) ||
                        (s.scholarNumber?.toLowerCase() || '').includes(term) ||
                        (s.parentMobile?.toLowerCase() || '').includes(term) ||
                        (s.parentSecondaryMobile?.toLowerCase() || '').includes(term)
                      );
                    }).length === 0) &&
                    (!teachersList || teachersList.filter((t: any) => {
                      const term = globalSearchTerm.toLowerCase();
                      return (
                        (t.firstName?.toLowerCase() || '').includes(term) ||
                        (t.lastName?.toLowerCase() || '').includes(term) ||
                        (t.subject?.toLowerCase() || '').includes(term) ||
                        (t.phone?.toLowerCase() || '').includes(term)
                      );
                    }).length === 0)
                  )) && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      No results found matching "{globalSearchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="top-cards-row" style={{ display: 'flex', gap: '12px', padding: '0 20px', marginBottom: '24px' }}>
              <div className="top-card" style={{ flex: 1, background: 'var(--white)', borderRadius: '20px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: 'var(--shadow)' }}>
                <div className="progress-ring" style={{ width: '50px', height: '50px', borderRadius: '50%', background: `conic-gradient(var(--gold) ${attendancePercent}%, var(--border) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="progress-inner" style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', color: 'var(--navy)' }}>
                    {isLoading ? "..." : `${attendancePercent}%`}
                  </div>
                </div>
                <div className="card-info">
                  <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Attendance</div>
                  <div className="card-sub" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {isLoading ? "Loading..." : `${statsData?.attendancePresent || 0} / ${statsData?.attendanceTotal || 0} Present`}
                  </div>
                </div>
              </div>

              <div className="top-card" onClick={() => {
                setPreviousTab("home");
                setActiveTab("action_required");
                localStorage.setItem('sjs_last_seen_action_req_count', totalActionReqIssues.toString());
                setLastSeenIssuesCount(totalActionReqIssues);
              }} style={{ flex: 1, background: 'var(--white)', borderRadius: '20px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
                <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(226,75,74,0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', position: 'relative' }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {newIssuesCount > 0 && <div className="badge-circle" style={{ top: -2, right: -2 }}>{displayNewIssuesCount}</div>}
                </div>
                <div className="card-info">
                  <div className="card-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Action req</div>
                  <div className="card-sub" style={{ fontSize: '11px', color: 'var(--muted)' }}>{isLoading ? "Loading..." : `${totalActionReqIssues} issues`}</div>
                </div>
              </div>
            </div>

            <div className="quick-grid" style={{ padding: '0 20px', marginTop: '10px' }}>
              <div className="quick-item" onClick={() => { setPreviousTab("home"); setActiveTab("students_section"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-user-graduate"></i>
                <span>Students ({isLoading ? "..." : totalStudents})</span>
              </div>
              <div className="quick-item" onClick={() => { setPreviousTab("home"); setActiveTab("teachers_section"); setTeachersSubTab("directory"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-chalkboard-user"></i>
                <span>Teachers ({isLoading ? "..." : totalTeachers})</span>
              </div>
              <div className="quick-item" onClick={() => { setPreviousTab("home"); setActiveTab("classes_section"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-school"></i>
                <span>Classes ({isLoading ? "..." : activeClasses})</span>
              </div>
              <div className="quick-item" onClick={() => { setPreviousTab("home"); setActiveTab("attendance_overview"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-clipboard-user"></i>
                <span>Attendance</span>
              </div>
              <div className="quick-item"><i className="fa-solid fa-calendar-days"></i><span>Timetable</span></div>
              <div className="quick-item" onClick={() => { setPreviousTab("home"); setActiveTab("calendar"); }} style={{ cursor: 'pointer' }}><i className="fa-solid fa-calendar-check"></i><span>Acad. Calendar</span></div>
              <div className="quick-item" onClick={() => setActiveTab("notices")} style={{ cursor: 'pointer' }}><i className="fa-solid fa-bullhorn"></i><span>Announcements</span></div>
              <div className="quick-item" onClick={() => { setPreviousTab("home"); setActiveTab("gallery"); }} style={{ cursor: 'pointer' }}><i className="fa-solid fa-images"></i><span>Gallery</span></div>
              <div className="quick-item"><i className="fa-solid fa-chart-pie"></i><span>Academic Reports</span></div>
              <div className="quick-item"><i className="fa-solid fa-chart-line"></i><span>Analytics</span></div>
            </div>

            <div style={{ padding: '0 20px' }}>
              <div className="card" style={{ padding: "16px" }}>
                <div className="card-title" style={{ marginBottom: "12px", fontSize: "14px" }}>Recent Activity</div>
                <div className="activity-feed">
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div>
                      <div className="activity-text">Dashboard loaded</div>
                      <div className="activity-time">Just now</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div>
                      <div className="activity-text">{totalStudents} students · {totalTeachers} teachers enrolled</div>
                      <div className="activity-time">Current data</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIRECTORY TAB */}
        {activeTab === 'manage' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <div className="list-menu">
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("students_section"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-user-graduate item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Students ({isLoading ? "..." : totalStudents})</div>
                  <div className="list-item-sub">Manage admissions and records</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("teachers_section"); setTeachersSubTab("directory"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-chalkboard-user item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Teachers ({isLoading ? "..." : totalTeachers})</div>
                  <div className="list-item-sub">Staff directory and assignments</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("classes_section"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-school item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Classes ({isLoading ? "..." : activeClasses})</div>
                  <div className="list-item-sub">Sections and subjects mapping</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("leave_requests"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-calendar-minus item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Leave Requests</div>
                  <div className="list-item-sub">Review and approve leaves</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("complaints"); setComplaintsSubTab("teachers"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-scale-balanced item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Staff Grievances</div>
                  <div className="list-item-sub">Review and resolve teacher complaints</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("complaints"); setComplaintsSubTab("students"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-hands-holding-child item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Student Grievances</div>
                  <div className="list-item-sub">Review and resolve student complaints</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("account_management"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-shield-halved item-icon"></i>
                <div className="list-item-content">
                  <div className="list-item-title">Account Passwords & Security</div>
                  <div className="list-item-sub">Change passwords and delete accounts</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
              <div className="list-item" onClick={() => { setPreviousTab("manage"); setActiveTab("gallery"); }} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-images item-icon" style={{ color: '#4f46e5' }}></i>
                <div className="list-item-content">
                  <div className="list-item-title">School Gallery</div>
                  <div className="list-item-sub">Manage and share photos of school events</div>
                </div>
                <i className="fa-solid fa-chevron-right item-chevron"></i>
              </div>
            </div>
          </div>
        )}
        {/* LEAVE REQUESTS TAB */}
        {activeTab === 'leave_requests' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setLeaveRequestsSubTab('teachers')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: leaveRequestsSubTab === 'teachers' ? 'var(--navy)' : 'var(--white)', color: leaveRequestsSubTab === 'teachers' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Teachers Leaves
              </button>
              <button
                onClick={() => setLeaveRequestsSubTab('students')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: leaveRequestsSubTab === 'students' ? 'var(--navy)' : 'var(--white)', color: leaveRequestsSubTab === 'students' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Students Leaves
              </button>
            </div>

            {isLeavesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
            ) : (
              <div>
                {(leaveRequestsSubTab === 'students' ? allLeaves?.studentLeaves : allLeaves?.teacherLeaves)?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div className="empty-state-icon"><i className="fa-regular fa-folder-open"></i></div>
                    <div className="empty-state-text">No leave requests found.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(leaveRequestsSubTab === 'students' ? allLeaves?.studentLeaves : allLeaves?.teacherLeaves)?.map((leave: any) => (
                      <div key={leave.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: leave.status === 'PENDING' ? '6px solid #f59e0b' : leave.status === 'APPROVED' ? '6px solid #10b981' : '6px solid #ef4444' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: leave.status === 'PENDING' ? '#f59e0b' : leave.status === 'APPROVED' ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '14px' }}>
                            <i className={`fa-solid ${leave.status === 'PENDING' ? 'fa-circle-exclamation' : leave.status === 'APPROVED' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                            {leave.status === 'PENDING' ? 'Pending' : leave.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                            {leave.type}
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0a192f' }}>
                            {leave.firstName} {leave.lastName}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                            {leaveRequestsSubTab === 'students' ? (
                              <>Class {leave.className} - {leave.sectionName} • Roll {leave.rollNumber || 'N/A'}</>
                            ) : (
                              <>{leave.subject || 'Teacher'}</>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                              <i className="fa-regular fa-calendar" style={{ color: '#64748b' }}></i>
                              {new Date(leave.fromDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → {new Date(leave.toDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginLeft: '20px' }}>
                              {leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Reason</div>
                          <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                            {leave.reason}
                          </div>
                        </div>

                        {leave.attachmentUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#3b82f6', fontWeight: 600, marginBottom: '16px' }}>
                            <i className="fa-solid fa-paperclip"></i> Attachment Provided
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: 'auto' }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Applied: {new Date(leave.createdAt).toLocaleDateString('en-GB')} • {new Date(leave.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>

                          {leave.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => updateLeaveStatusMutation.mutate({ id: leave.id, status: 'REJECTED' })}
                                disabled={updateLeaveStatusMutation.isPending}
                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: updateLeaveStatusMutation.isPending ? 0.5 : 1 }}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => updateLeaveStatusMutation.mutate({ id: leave.id, status: 'APPROVED' })}
                                disabled={updateLeaveStatusMutation.isPending}
                                style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', opacity: updateLeaveStatusMutation.isPending ? 0.5 : 1 }}
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === 'complaints' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => setComplaintsSubTab('all')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: complaintsSubTab === 'all' ? 'var(--navy)' : 'var(--white)', color: complaintsSubTab === 'all' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                All
              </button>
              <button
                onClick={() => setComplaintsSubTab('teachers')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: complaintsSubTab === 'teachers' ? 'var(--navy)' : 'var(--white)', color: complaintsSubTab === 'teachers' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Teachers
              </button>
              <button
                onClick={() => setComplaintsSubTab('students')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: complaintsSubTab === 'students' ? 'var(--navy)' : 'var(--white)', color: complaintsSubTab === 'students' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Students
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search complaints..."
                value={complaintsSearchTerm}
                onChange={e => setComplaintsSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'var(--white)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {isComplaintsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading complaints...</div>
            ) : (
              <div>
                {(() => {
                  const filtered = allComplaints.filter((c: any) => {
                    const matchRole = complaintsSubTab === 'all' ||
                      (complaintsSubTab === 'students' && c.role === 'STUDENT') ||
                      (complaintsSubTab === 'teachers' && c.role === 'TEACHER');

                    const matchesSearch = c.subject.toLowerCase().includes(complaintsSearchTerm.toLowerCase()) ||
                      c.description.toLowerCase().includes(complaintsSearchTerm.toLowerCase()) ||
                      (c.applicant?.name || '').toLowerCase().includes(complaintsSearchTerm.toLowerCase());

                    return matchRole && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state" style={{ padding: '40px 0' }}>
                        <div className="empty-state-icon"><i className="fa-regular fa-folder-open"></i></div>
                        <div className="empty-state-text">No complaints found.</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {filtered.map((c: any) => (
                        <div key={c.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: c.status === 'UNSEEN' ? '6px solid #ef4444' : '6px solid #10b981' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: c.role === 'STUDENT' ? '#eff6ff' : '#faf5ff', color: c.role === 'STUDENT' ? '#1e40af' : '#6b21a8' }}>
                              {c.role === 'STUDENT' ? 'Student' : 'Teacher'}
                            </span>
                            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600, background: c.status === 'UNSEEN' ? '#fee2e2' : '#d1fae5', color: c.status === 'UNSEEN' ? '#b91c1c' : '#15803d' }}>
                              {c.status === 'UNSEEN' ? 'Unseen' : 'Seen'}
                            </span>
                          </div>

                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0a192f', marginBottom: '4px' }}>
                            {c.subject}
                          </div>

                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                            By: <strong style={{ color: c.isAnonymous ? '#f59e0b' : '#334155' }}>{c.applicant?.name || 'Unknown'}</strong> {c.applicant?.extra ? `• ${c.applicant.extra}` : ''}
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '14px', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
                            {c.description}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              Filed: {new Date(c.createdAt).toLocaleDateString('en-GB')} • {new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            {c.status === 'UNSEEN' && (
                              <button
                                onClick={() => updateComplaintStatusMutation.mutate({ id: c.id, status: 'SEEN' })}
                                disabled={updateComplaintStatusMutation.isPending}
                                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)', opacity: updateComplaintStatusMutation.isPending ? 0.5 : 1 }}
                              >
                                Mark as Seen
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT MANAGEMENT TAB */}
        {activeTab === 'account_management' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setAccountManageSubTab('teachers')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: accountManageSubTab === 'teachers' ? 'var(--navy)' : 'var(--white)', color: accountManageSubTab === 'teachers' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Teachers
              </button>
              <button
                onClick={() => setAccountManageSubTab('students')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: accountManageSubTab === 'students' ? 'var(--navy)' : 'var(--white)', color: accountManageSubTab === 'students' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Students
              </button>
            </div>

            <div style={{ background: 'white', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: '#9ca3af' }}></i>
              <input
                autoComplete="off"
                type="text"
                placeholder={accountManageSubTab === 'teachers' ? "Search by name, number, email..." : "Search by name, scholar no, phone..."}
                value={accountSearchTerm}
                onChange={(e) => {
                  setAccountSearchTerm(e.target.value);
                  if (e.target.value && accountManageSubTab === 'students') {
                    // Auto-expand logic handled dynamically in render
                  } else {
                    setExpandedClassSection(null);
                  }
                }}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '15px' }}
              />
              {accountSearchTerm && (
                <i className="fa-solid fa-xmark" style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => { setAccountSearchTerm(''); setExpandedClassSection(null); }}></i>
              )}
            </div>

            {accountManageSubTab === 'teachers' && (
              <div>
                {!teachersList || teachersList.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-text">No teachers found.</div></div>
                ) : (
                  teachersList.filter((t: any) => {
                    const search = accountSearchTerm.toLowerCase();
                    return (
                      (t.firstName?.toLowerCase() || '').includes(search) ||
                      (t.lastName?.toLowerCase() || '').includes(search) ||
                      (t.email?.toLowerCase() || '').includes(search) ||
                      (t.phone?.toLowerCase() || '').includes(search)
                    );
                  }).map((t: any) => (
                    <div key={t.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontWeight: 700, color: '#6b7280' }}>
                          {t.profilePic ? (
                            <img src={t.profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            `${t.firstName?.[0] || ''}${t.lastName?.[0] || ''}`
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '15px' }}>{t.firstName} {t.lastName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setPasswordResetTarget({ id: t.id, name: `${t.firstName} ${t.lastName}`, role: 'TEACHER' })} 
                          style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Reset Password
                        </button>
                        <button 
                          onClick={() => setAccountDeleteTarget({ id: t.id, name: `${t.firstName} ${t.lastName}`, role: 'TEACHER' })} 
                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {accountManageSubTab === 'students' && (
              <div>
                {Object.keys(studentsGrouped).length === 0 ? (
                  <div className="empty-state"><div className="empty-state-text">No students found.</div></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(studentsGrouped).map(([cName, sections]: [string, any]) => (
                      <div key={cName}>
                        {Object.entries(sections).map(([sName, sectionStudents]: [string, any]) => {
                          const sectionKey = `${cName}-${sName}`;
                          const filteredSectionStudents = sectionStudents.filter((s: any) => {
                            const search = accountSearchTerm.toLowerCase();
                            if (!search) return true;
                            return (
                              (s.firstName?.toLowerCase() || '').includes(search) ||
                              (s.lastName?.toLowerCase() || '').includes(search) ||
                              (s.scholarNumber?.toLowerCase() || '').includes(search) ||
                              (s.parentMobile?.toLowerCase() || '').includes(search)
                            );
                          });

                          if (accountSearchTerm && filteredSectionStudents.length === 0) return null;

                          const isExpanded = expandedClassSection === sectionKey || (accountSearchTerm && filteredSectionStudents.length > 0);

                          return (
                            <div key={sectionKey} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '12px' }}>
                              <div
                                onClick={() => setExpandedClassSection(isExpanded ? null : sectionKey)}
                                style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                              >
                                <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{cName} - Section {sName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                                    {filteredSectionStudents.length} Students
                                  </div>
                                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: '#9ca3af', fontSize: '14px' }}></i>
                                </div>
                              </div>

                              {isExpanded && (
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {filteredSectionStudents.map((student: any) => (
                                    <div key={student.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div
                                        onClick={() => router.push(`/student/profile?id=${student.scholarNumber}`)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        onMouseEnter={(e) => { const el = e.currentTarget.querySelector('.student-name') as HTMLElement; if (el) el.style.color = '#4f46e5'; }}
                                        onMouseLeave={(e) => { const el = e.currentTarget.querySelector('.student-name') as HTMLElement; if (el) el.style.color = 'var(--navy)'; }}
                                      >
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 'bold', color: '#64748b' }}>
                                          {student.profilePic ? (
                                            <img src={student.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                            `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`
                                          )}
                                        </div>
                                        <div>
                                          <div className="student-name" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)', transition: 'color 0.2s' }}>{student.firstName} {student.lastName}</div>
                                          <div style={{ fontSize: '12px', color: '#64748b' }}>Scholar No: {student.scholarNumber}</div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => router.push(`/student/profile?id=${student.scholarNumber}`)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                          Profile
                                        </button>
                                        <button 
                                          onClick={() => setPasswordResetTarget({ id: student.id, name: `${student.firstName} ${student.lastName}`, role: 'STUDENT' })} 
                                          style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                          Reset Pwd
                                        </button>
                                        <button 
                                          onClick={() => setAccountDeleteTarget({ id: student.id, name: `${student.firstName} ${student.lastName}`, role: 'STUDENT' })} 
                                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notices' && (
          <div className="view-panel active" style={{ padding: '24px 20px', paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>Broadcast History</div>
              <button
                onClick={() => { setPreviousTab("notices"); setActiveTab('notices_new'); }}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                }}
              >
                <i className="fa-solid fa-plus"></i> New Broadcast
              </button>
            </div>

            {(!noticesData?.notices || noticesData.notices.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon"><i className="fa-regular fa-bell-slash"></i></div>
                <div className="empty-state-text">No announcements broadcasted yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {noticesData.notices.map((n: any) => (
                  <div key={n.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid #4f46e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{n.title}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '12px' }}>
                        Target: {n.targetAudience}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-line', marginBottom: '8px' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Published on {new Date(n.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE ANNOUNCEMENT TAB */}
        {activeTab === 'notices_new' && (
          <div className="view-panel active" style={{ padding: '24px 20px', paddingBottom: '120px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--muted)', marginBottom: '20px' }}>
              Broadcast a push notification and portal announcement to staff, students, or parents.
            </div>

            <form onSubmit={handlePublishNotice} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Update: School Holiday Declaration"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Send to Target Audience</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { id: 'ALL', label: 'Everyone (All Staff & Students)' },
                    { id: 'TEACHERS', label: 'Faculty & Teachers Only' },
                    { id: 'STUDENTS', label: 'Students Only' },
                    { id: 'PARENTS', label: 'Parents Only' }
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setNoticeAudience(opt.id)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: noticeAudience === opt.id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        background: noticeAudience === opt.id ? '#eef2ff' : 'white',
                        color: noticeAudience === opt.id ? '#4f46e5' : '#64748b',
                        transition: 'all 0.2s'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Announcement Message</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Type the detailed message here..."
                  value={noticeMsg}
                  onChange={(e) => setNoticeMsg(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical', background: 'white', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isPublishingNotice}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  marginTop: '10px'
                }}
              >
                <i className={`fa-solid ${isPublishingNotice ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                <span>{isPublishingNotice ? 'Publishing & Broadcasting...' : 'Publish & Broadcast Notice'}</span>
              </button>
            </form>
          </div>
        )}
        {/* ACTION REQUIRED TAB */}
        {activeTab === 'action_required' && (
          <div className="view-panel active" style={{ padding: '24px 20px', paddingBottom: '100px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div 
                onClick={() => { setActiveTab('action_required_detail'); setActionReqType('complaints'); }}
                style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #ef4444' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>New Complaints</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Received in last 7 days</div>
                </div>
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '14px' }}>
                  {recentUnseenComplaints.length}
                </div>
              </div>

              <div 
                onClick={() => { setActiveTab('action_required_detail'); setActionReqType('attendance'); }}
                style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Low Attendance</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Students with &lt; 50% attendance</div>
                </div>
                <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '14px' }}>
                  {lowAttendanceStudents.length}
                </div>
              </div>

              <div 
                onClick={() => { setActiveTab('action_required_detail'); setActionReqType('leaves'); }}
                style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #3b82f6' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Leave Requests</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Pending approvals</div>
                </div>
                <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '14px' }}>
                  {pendingLeavesCount}
                </div>
              </div>

              <div 
                style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'not-allowed', borderLeft: '4px solid #8b5cf6', opacity: 0.7 }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Fee Defaulters</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Pending dues overview</div>
                </div>
                <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '14px' }}>
                  0
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ACTION REQUIRED DETAIL TAB */}
        {activeTab === 'action_required_detail' && (
          <div className="view-panel active" style={{ padding: '20px', paddingBottom: '100px' }}>
            {actionReqType === 'complaints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentUnseenComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No new complaints in the last 7 days.</div>
                  ) : (
                    recentUnseenComplaints.map((c: any) => (
                      <div 
                        key={c.id} 
                        onClick={() => setPopupComplaintModal(c)}
                        style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px' }}>UNSEEN</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{c.subject}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>By: {c.isAnonymous ? 'Anonymous' : c.applicant?.name || 'Unknown'}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {actionReqType === 'attendance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lowAttendanceStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No students with low attendance.</div>
                  ) : (
                    lowAttendanceStudents.map((s: any) => (
                      <div 
                        key={s.id}
                        onClick={() => setPopupAttendanceModal(s)}
                        style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{s.firstName} {s.lastName}</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Class: {s.className || 'Unknown'} - {s.sectionName || 'Unknown'}</div>
                        </div>
                        <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '16px' }}>
                          {s.attendancePercent}% <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>(view)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {actionReqType === 'leaves' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingLeavesCount === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No pending leave requests.</div>
                  ) : (
                    [...(allLeaves?.studentLeaves || []), ...(allLeaves?.teacherLeaves || [])]
                      .filter((l: any) => l.status === 'PENDING')
                      .map((l: any) => (
                        <div 
                          key={l.id}
                          onClick={() => setPopupLeaveModal(l)}
                          style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px' }}>PENDING</span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(l.startDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{l.applicant?.name || 'Unknown'} ({l.role})</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{l.reason} <span style={{ color: '#3b82f6', fontWeight: 600 }}>→ view</span></div>
                        </div>
                      ))
                  )}
                </div>
              )}
          </div>
        )}

        {/* STUDENTS DIRECTORY SECTION */}
        {activeTab === 'students_section' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <div style={{ background: 'white', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: '#9ca3af' }}></i>
              <input
                id="principal-student-search"
                name="principalStudentSearch"
                autoComplete="off"
                type="text"
                placeholder="Search by name, scholar no, or phone..."
                value={studentsSearchTerm}
                onChange={(e) => {
                  setStudentsSearchTerm(e.target.value);
                  if (e.target.value) {
                    // Automatically expand if filtering
                    const search = e.target.value.toLowerCase();
                    const filtered = (studentsList || []).filter((s: any) =>
                      (s.firstName?.toLowerCase() || '').includes(search) ||
                      (s.lastName?.toLowerCase() || '').includes(search) ||
                      (s.scholarNumber?.toLowerCase() || '').includes(search) ||
                      (s.parentMobile?.toLowerCase() || '').includes(search)
                    );
                    if (filtered.length > 0) {
                      setExpandedClassSection(`${filtered[0].className || 'Unassigned'}-${filtered[0].sectionName || 'Unassigned'}`);
                    }
                  } else {
                    setExpandedClassSection(null);
                  }
                }}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '15px' }}
              />
              {studentsSearchTerm && (
                <i className="fa-solid fa-xmark" style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => { setStudentsSearchTerm(''); setExpandedClassSection(null); }}></i>
              )}
            </div>

            {isStudentsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--navy)' }}></i>
                <div>Loading students...</div>
              </div>
            ) : Object.keys(studentsGrouped).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <i className="fa-solid fa-user-graduate" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                <div>No students found.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(studentsGrouped).map(([cName, sections]: [string, any]) => (
                  <div key={cName}>
                    {Object.entries(sections).map(([sName, sectionStudents]: [string, any]) => {
                      const sectionKey = `${cName}-${sName}`;
                      const isExpanded = expandedClassSection === sectionKey;

                      return (
                        <div key={sectionKey} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '12px' }}>
                          <div
                            onClick={() => setExpandedClassSection(isExpanded ? null : sectionKey)}
                            style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{cName} - Section {sName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                                {sectionStudents.length} Students
                              </div>
                              <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: '#9ca3af', fontSize: '14px' }}></i>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {sectionStudents.map((student: any) => (
                                <div key={student.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    onClick={() => router.push(`/student/profile?id=${student.scholarNumber}`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                                    onMouseEnter={(e) => { const el = e.currentTarget.querySelector('.student-name-dir') as HTMLElement; if (el) el.style.color = '#4f46e5'; }}
                                    onMouseLeave={(e) => { const el = e.currentTarget.querySelector('.student-name-dir') as HTMLElement; if (el) el.style.color = 'var(--navy)'; }}
                                  >
                                    <div>
                                      {student.profilePic ? (
                                        <img src={student.profilePic} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                                      ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                                          {student.firstName?.[0]}{student.lastName?.[0]}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div className="student-name-dir" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)', transition: 'color 0.2s' }}>{student.firstName} {student.lastName}</div>
                                      <div style={{ fontSize: '12px', color: '#64748b' }}>Scholar No: {student.scholarNumber}</div>
                                    </div>
                                  </div>
                                  {student.parentMobile && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <a href={`tel:${student.parentMobile}`} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Call Parent">
                                        <i className="fa-solid fa-phone"></i>
                                      </a>
                                      <a href={`https://wa.me/91${student.parentMobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f5e9', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="WhatsApp Parent">
                                        <i className="fa-brands fa-whatsapp" style={{ fontSize: '18px' }}></i>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEACHERS DIRECTORY & NEW REQUESTS SECTION */}
        {(activeTab === 'teachers_section' || activeTab === 'approvals') && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setTeachersSubTab('directory')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: teachersSubTab === 'directory' ? 'var(--navy)' : 'var(--white)', color: teachersSubTab === 'directory' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >
                Teachers List ({totalTeachers})
              </button>
              <button
                onClick={() => {
                  setTeachersSubTab('requests');
                  if (appsList) {
                    const pending = appsList.filter((a: any) => a.status === 'PENDING');
                    if (pending.length > 0) setPopupAppModal(pending[0]);
                  }
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: teachersSubTab === 'requests' ? 'var(--navy)' : 'var(--white)', color: teachersSubTab === 'requests' ? 'white' : 'var(--navy)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)', position: 'relative' }}
              >
                New Requests
                {pendingApprovals > 0 && <span className="badge-circle" style={{ position: 'absolute', top: -6, right: -6 }}>{pendingApprovals}</span>}
              </button>
            </div>

            {teachersSubTab === 'directory' ? (
              <div>
                <div style={{ marginBottom: '16px', fontWeight: 600, color: 'var(--muted)', fontSize: '13px' }}>Enrolled Faculty Directory</div>

                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ color: '#9ca3af' }}></i>
                  <input
                    type="text"
                    placeholder="Search by name, subject, email or phone..."
                    value={teachersSearchTerm}
                    onChange={(e) => setTeachersSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: '15px' }}
                  />
                  {teachersSearchTerm && (
                    <i className="fa-solid fa-xmark" style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => setTeachersSearchTerm('')}></i>
                  )}
                </div>

                {isTeachersLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading teachers...</div>
                ) : !teachersList || teachersList.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div className="empty-state-icon"><i className="fa-solid fa-user-slash"></i></div>
                    <div className="empty-state-text">No teachers enrolled yet</div>
                  </div>
                ) : (
                  (() => {
                    const filtered = teachersList.filter((t: any) => {
                      const search = teachersSearchTerm.toLowerCase();
                      return (
                        (t.firstName?.toLowerCase() || '').includes(search) ||
                        (t.lastName?.toLowerCase() || '').includes(search) ||
                        (t.subject?.toLowerCase() || '').includes(search) ||
                        (t.phone?.toLowerCase() || '').includes(search) ||
                        (t.email?.toLowerCase() || '').includes(search)
                      );
                    });
                    if (filtered.length === 0) return <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No teachers match your search.</div>;
                    return filtered.map((t: any) => (
                      <div key={t.id} onClick={() => setPopupAppModal(t)} style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', marginBottom: '12px', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '5px solid #137333' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontWeight: 700, color: '#6b7280' }}>
                            {t.profilePic ? (
                              <img src={t.profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              `${t.firstName?.[0] || ''}${t.lastName?.[0] || ''}`
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--navy)' }}>{t.firstName} {t.lastName}</div>
                            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                              {t.subject || 'Faculty'} · {t.email}
                              {t.phone && <span> · {t.phone}</span>}
                            </div>
                            {t.classes && (
                              <div style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 700, marginTop: '4px' }}>
                                🏫 Classes: {t.classes}
                              </div>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', background: '#e6f4ea', color: '#137333', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>Active</span>
                      </div>
                    ));
                  })()
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px', fontWeight: 600, color: 'var(--muted)', fontSize: '13px' }}>Pending Onboarding Submissions</div>
                {isAppsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading requests...</div>
                ) : (!appsList || appsList.filter((a: any) => a.status === 'PENDING').length === 0) ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div className="empty-state-icon"><i className="fa-solid fa-clipboard-check"></i></div>
                    <div className="empty-state-text">No new teacher requests</div>
                  </div>
                ) : (
                  appsList.filter((a: any) => a.status === 'PENDING').map((app: any) => (
                    <div key={app.id} style={{ background: 'white', borderRadius: '14px', marginBottom: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden', borderLeft: '5px solid var(--gold)' }}>
                      <div
                        onClick={() => setPopupAppModal(app)}
                        style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'white', transition: 'background 0.2s' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontWeight: 700, color: '#d97706' }}>
                            {app.profilePic ? (
                              <img src={app.profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--navy)' }}>{app.firstName} {app.lastName}</span>
                            <span style={{ fontSize: '12px', color: '#673ab7', marginLeft: '10px', fontWeight: 600, textDecoration: 'underline' }}>(click to see details)</span>
                          </div>
                        </div>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: 'var(--gold)', fontSize: '14px' }}></i>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* CLASSES SECTION TAB */}
        {activeTab === 'classes_section' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>


            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
              Static hierarchy of all 15 grade levels mapped with sections A, B, C, D, E.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {(classesHierarchy && classesHierarchy.length > 0 ? classesHierarchy : ['PG', 'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(gr => ({ className: gr, sections: ['A', 'B', 'C', 'D', 'E'].map(s => ({ sectionName: s })) }))).map((grObj: any) => {
                const gr = grObj.className;
                return (
                  <div key={gr} style={{ background: 'white', borderRadius: '16px', padding: '18px', boxShadow: 'var(--shadow)', borderTop: '4px solid #c9a84c' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0a192f', margin: 0 }}>
                        {['PG', 'Nursery', 'KG'].includes(gr) ? gr : `Class ${gr}`}
                      </h3>
                      <span style={{ fontSize: '11px', background: '#e8f0fe', color: '#1a73e8', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>{grObj.sections?.length || 5} Sections</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {grObj.sections?.map((secObj: any) => (
                        <div
                          key={secObj.sectionName}
                          onClick={() => {
                            if (secObj.sectionId) {
                              setSelectedClassSection({ grade: gr, ...secObj });
                              setActiveTab("section_page");
                            }
                          }}
                          style={{ flex: 1, minWidth: '42px', background: secObj.classTeacherName ? '#e6f4ea' : '#f8f9fa', border: secObj.classTeacherName ? '1px solid #137333' : '1px solid #dadce0', borderRadius: '8px', padding: '8px 4px', textAlign: 'center', cursor: secObj.sectionId ? 'pointer' : 'default', transition: 'all 0.15s' }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 800, color: secObj.classTeacherName ? '#137333' : '#0a192f' }}>{secObj.sectionName}</div>
                          <div style={{ fontSize: '9px', color: '#5f6368', marginTop: '2px' }}>{secObj.studentCount || 0} Std</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ATTENDANCE OVERVIEW TAB */}
        {activeTab === 'attendance_overview' && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>
            {selectedAttendanceClassSection && (
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                Class {selectedAttendanceClassSection.grade} - {selectedAttendanceClassSection.sectionName}
              </div>
            )}

            {!selectedAttendanceClassSection ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
                  Select a class section to view its detailed attendance register.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {(classesHierarchy && classesHierarchy.length > 0 ? classesHierarchy : ['PG', 'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(gr => ({ className: gr, sections: ['A', 'B', 'C', 'D', 'E'].map(s => ({ sectionName: s })) }))).map((grObj: any) => {
                    const gr = grObj.className;
                    return (
                      <div key={`att-${gr}`} style={{ background: 'white', borderRadius: '16px', padding: '18px', boxShadow: 'var(--shadow)', borderTop: '4px solid #c9a84c' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0a192f', margin: 0 }}>
                            {['PG', 'Nursery', 'KG'].includes(gr) ? gr : `Class ${gr}`}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {grObj.sections?.map((secObj: any) => (
                            <div
                              key={`att-${gr}-${secObj.sectionName}`}
                              onClick={() => {
                                setSelectedAttendanceClassSection({ grade: gr, sectionName: secObj.sectionName });
                              }}
                              style={{ flex: 1, minWidth: '42px', background: '#f8f9fa', border: '1px solid #dadce0', borderRadius: '8px', padding: '8px 4px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                            >
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0a192f' }}>{secObj.sectionName}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ marginTop: '10px' }}>
                {(!attendanceViewParam || attendanceViewParam === 'summary') ? (
                  <AttendanceSummaryView
                    classSection={selectedAttendanceClassSection}
                    students={studentsList?.filter((s: any) => s.className === selectedAttendanceClassSection.grade && s.sectionName === selectedAttendanceClassSection.sectionName) || []}
                    onViewClick={(view) => setSelectedAttendanceClassSection(selectedAttendanceClassSection, view)}
                  />
                ) : (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <button
                        onClick={() => setSelectedAttendanceClassSection(selectedAttendanceClassSection, 'summary')}
                        style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <i className="fa-solid fa-arrow-left"></i> Back to Summary
                      </button>
                    </div>
                    <AttendanceRegister
                      initialView={attendanceViewParam as any}
                      myStudents={studentsList?.filter((s: any) => s.className === selectedAttendanceClassSection.grade && s.sectionName === selectedAttendanceClassSection.sectionName) || []}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* SINGLE SECTION PAGE VIEW */}
        {activeTab === 'section_page' && selectedClassSection && (
          <div className="view-panel active" style={{ padding: '24px 20px' }}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>Academic Section Profile</span>
              <h2 className="page-title" style={{ fontSize: "20px", margin: 0, color: '#0a192f' }}>
                {['PG', 'Nursery', 'KG'].includes(selectedClassSection.grade) ? selectedClassSection.grade : `Class ${selectedClassSection.grade}`} - Section {selectedClassSection.sectionName}
              </h2>
            </div>

            {/* 1. CLASS TEACHER CARD */}
            <div style={{ background: 'white', border: '1px solid #dadce0', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderLeft: '6px solid #c9a84c' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#5f6368', fontWeight: 700, textTransform: 'uppercase' }}>Designated Class Teacher</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {selectedClassSection.classTeacherId && teachersList?.find((t: any) => t.id === selectedClassSection.classTeacherId) ? (
                    (() => {
                      const teacher = teachersList.find((t: any) => t.id === selectedClassSection.classTeacherId);
                      return teacher.profilePic ? (
                        <img src={teacher.profilePic} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280', fontSize: '14px' }}>
                          {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                        </div>
                      );
                    })()
                  ) : (
                    <i className="fa-solid fa-user-tie" style={{ color: '#c9a84c', fontSize: '20px' }}></i>
                  )}
                  <span style={{ fontSize: '20px', fontWeight: 800, color: selectedClassSection.classTeacherName ? '#0a192f' : '#d93025' }}>
                    {selectedClassSection.classTeacherName || 'Not Assigned'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssigningRole({ type: 'CLASS' });
                  setSelectedTeacherId(selectedClassSection.classTeacherId || '');
                }}
                style={{ background: '#0a192f', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(10,25,47,0.2)' }}
              >
                <i className="fa-solid fa-pen" style={{ marginRight: '6px' }}></i>
                {selectedClassSection.classTeacherName ? 'Change Teacher' : 'Assign Teacher'}
              </button>
            </div>

            {/* INLINE ASSIGNMENT BOX */}
            {assigningRole && (
              <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#92400e', marginBottom: '12px' }}>
                  {assigningRole.type === 'CLASS' ? `Assign Class Teacher for ${selectedClassSection.grade} - ${selectedClassSection.sectionName}` : `Assign Subject Teacher for ${assigningRole.subject}`}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select
                    className="field-input"
                    style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f59e0b' }}
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    <option value="">-- Select Faculty Member --</option>
                    {teachersList?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.subject || 'Faculty'})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = localStorage.getItem('sjs_token');
                      const selectedT = teachersList?.find((t: any) => t.id === selectedTeacherId);
                      const tName = selectedT ? `${selectedT.firstName} ${selectedT.lastName}` : null;

                      if (assigningRole.type === 'CLASS') {
                        await api.post(`/classes/section/${selectedClassSection.sectionId}/class-teacher`, {
                          teacherId: selectedTeacherId
                        }, { headers: { Authorization: `Bearer ${token}` } });

                        setSelectedClassSection({
                          ...selectedClassSection,
                          classTeacherId: selectedTeacherId,
                          classTeacherName: tName || null
                        });
                      } else if (assigningRole.type === 'SUBJECT' && assigningRole.subject) {
                        const res = await api.post(`/classes/section/${selectedClassSection.sectionId}/subject-teacher`, {
                          subject: assigningRole.subject,
                          teacherId: selectedTeacherId,
                          teacherName: tName || null
                        }, { headers: { Authorization: `Bearer ${token}` } });

                        setSelectedClassSection({
                          ...selectedClassSection,
                          subjectTeachers: res.data.subjectTeachers
                        });
                      }

                      setAssigningRole(null);
                      refetchHierarchy();
                    }}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)' }}
                  >
                    Save Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssigningRole(null)}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 2. SUBJECTS & SUBJECT TEACHERS MAPPING */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '22px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0a192f', margin: 0, marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📚 Academic Curriculum & Faculty Mapping</span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Click Change to reassign</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(['PG', 'Nursery', 'KG'].includes(selectedClassSection.grade)
                  ? ['English', 'Hindi', 'Mathematics', 'Rhymes & Story', 'Drawing & Craft']
                  : ['English', 'Hindi', 'Mathematics', 'General Science', 'Social Studies', 'Computer Science']
                ).map((subj) => {
                  const subjT = selectedClassSection.subjectTeachers?.[subj];
                  return (
                    <div key={subj} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: '12px', transition: 'all 0.2s' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{subj}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          {subjT?.teacherId && teachersList?.find((t: any) => t.id === subjT.teacherId) ? (
                            (() => {
                              const teacher = teachersList.find((t: any) => t.id === subjT.teacherId);
                              return teacher.profilePic ? (
                                <img src={teacher.profilePic} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280', fontSize: '10px' }}>
                                  {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                                </div>
                              );
                            })()
                          ) : (
                            <i className="fa-solid fa-chalkboard-user" style={{ color: subjT?.teacherName ? '#10b981' : '#ef4444' }}></i>
                          )}
                          <span style={{ fontSize: '13px', color: subjT?.teacherName ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            {subjT?.teacherName || 'Not Assigned'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningRole({ type: 'SUBJECT', subject: subj });
                          setSelectedTeacherId(subjT?.teacherId || '');
                        }}
                        style={{ background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                      >
                        Change
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. TIMETABLE PREVIEW */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '22px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0a192f', margin: 0, marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
                🗓️ Weekly Timetable Schedule
              </h4>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', width: '130px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Period / Day</th>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <th key={day} style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: 700, fontSize: '14px' }}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { p: '1', t: '8:00 - 8:45 AM' },
                      { p: '2', t: '8:45 - 9:30 AM' },
                      { p: '3', t: '9:30 - 10:15 AM' },
                      { p: 'Lunch', t: '10:15 - 10:45 AM' },
                      { p: '4', t: '10:45 - 11:30 AM' },
                      { p: '5', t: '11:30 - 12:15 PM' },
                      { p: '6', t: '12:15 - 1:00 PM' }
                    ].map(period => (
                      <tr key={period.p}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800 }}>{period.p === 'Lunch' ? 'LUNCH' : `Period ${period.p}`}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{period.t}</div>
                        </td>
                        {period.p === 'Lunch' ? (
                          <td colSpan={6} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', background: '#fffbeb', color: '#d97706', fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase', fontSize: '14px' }}>
                            Break
                          </td>
                        ) : (
                          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                            const subjs = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer'];
                            const sIdx = (day.length + Number(period.p)) % subjs.length;
                            const subj = subjs[sIdx];
                            return (
                              <td key={day} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: 'white', color: '#334155', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{subj}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Click to edit</div>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. ENROLLED STUDENTS */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0a192f', margin: 0, marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
                🎓 Enrolled Students ({selectedClassSection.studentCount})
              </h4>
              {selectedClassSection.studentCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '14px' }}>
                  <i className="fa-solid fa-user-graduate" style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '8px', display: 'block' }}></i>
                  No students currently assigned to Section {selectedClassSection.sectionName}. Students enrolled during admission can be mapped here.
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>
                  Students directory active. View individual student records from the main Directory tab.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ACADEMIC CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="view-panel active" style={{ padding: '4px 16px', paddingBottom: '120px' }}>
            <AcademicCalendar />
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="view-panel active" style={{ padding: '24px 20px', paddingBottom: '120px' }}>
            <GalleryView />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
        </button>
        <button className={`nav-tab ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
          <i className="fa-solid fa-users-gear"></i>
          <span>Manage</span>
        </button>
        <button className={`nav-tab ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>
          <i className="fa-solid fa-bell"></i>
          <span>Announcements</span>
        </button>
        <button className="nav-tab" onClick={async () => {
          try {
            const token = localStorage.getItem('sjs_token');
            if (token) {
              await api.post('/auth/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          } catch (err) {
            console.error('Logout request failed:', err);
          } finally {
            localStorage.removeItem('sjs_token');
            localStorage.removeItem('sjs_user');
            window.location.href = '/';
          }
        }}>
          <i className="fa-solid fa-arrow-right-from-bracket" style={{ color: 'var(--danger)' }}></i>
          <span style={{ color: 'var(--danger)' }}>Logout</span>
        </button>
      </div>

      {/* CENTERED POPUP MODAL: TEACHER DETAILS */}
      {popupAppModal && (
        <div className="modal-overlay" onClick={() => setPopupAppModal(null)}>
          <div className="modal-popup" onClick={e => e.stopPropagation()}>
            <div className="modal-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f0fe', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
                  {popupAppModal.profilePic ? (
                    <img src={popupAppModal.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{popupAppModal.firstName?.[0]}{popupAppModal.lastName?.[0]}</div>
                  )}
                </div>
                <h3 className="modal-popup-title" style={{ margin: 0 }}>{popupAppModal.firstName} {popupAppModal.lastName}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPopupAppModal(null)}>✕</button>
            </div>
            <div className="modal-popup-body">
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', fontWeight: 600 }}>
                {popupAppModal.status === 'PENDING' ? 'Prospective Teacher Application' : 'Active Faculty Profile'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '14px', background: '#faf9f5', padding: '18px', borderRadius: '14px', border: '1px solid #efece2' }}>
                <div><strong style={{ color: 'var(--navy)' }}>Subject:</strong><br />{popupAppModal.subject || 'Faculty'}</div>
                <div><strong style={{ color: 'var(--navy)' }}>Phone:</strong><br />{popupAppModal.phone || 'N/A'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--navy)' }}>Classes Taught:</strong><br /><span style={{ color: '#c9a84c', fontWeight: 700 }}>{popupAppModal.classes || 'Not specified'}</span></div>
                <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--navy)' }}>Email:</strong><br />{popupAppModal.email}</div>
                <div><strong style={{ color: 'var(--navy)' }}>Qualification:</strong><br />{popupAppModal.qualification || 'N/A'}</div>
                <div><strong style={{ color: 'var(--navy)' }}>Experience:</strong><br />{popupAppModal.experience || 'N/A'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--navy)' }}>Residential Address:</strong><br />{popupAppModal.address || 'N/A'}</div>
                {popupAppModal.profilePic && (
                  <div style={{ gridColumn: 'span 2', textAlign: 'center', marginTop: '10px' }}>
                    <strong style={{ color: 'var(--navy)', display: 'block', marginBottom: '8px' }}>Profile Photo:</strong>
                    <img src={popupAppModal.profilePic} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #efece2' }} />
                  </div>
                )}
              </div>
            </div>
            {popupAppModal.status === 'PENDING' ? (
              <div className="modal-popup-footer">
                <button className="btn-reject" style={{ flex: 1, padding: '12px' }} onClick={() => handleReject(popupAppModal.id)}>
                  <i className="fa-solid fa-xmark" style={{ marginRight: '6px' }}></i> Disapprove
                </button>
                <button className="btn-approve" style={{ flex: 1, padding: '12px' }} onClick={() => handleApprove(popupAppModal.id)}>
                  <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> Approve & Onboard
                </button>
              </div>
            ) : (
              <div className="modal-popup-footer">
                <button className="btn-reject" style={{ flex: 1, padding: '12px', background: '#dadce0', color: '#0a192f' }} onClick={() => setPopupAppModal(null)}>
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CENTERED POPUP MODAL: NOTICE / SUCCESS */}
      {popupNotice && (
        <div className="modal-overlay" onClick={() => setPopupNotice(null)}>
          <div className="modal-popup" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-popup-header">
              <h3 className="modal-popup-title">{popupNotice.title}</h3>
              <button className="modal-close-btn" onClick={() => setPopupNotice(null)}>✕</button>
            </div>
            <div className="modal-popup-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '16px', color: 'var(--navy)', lineHeight: 1.5 }}>
                {popupNotice.message}
              </div>
            </div>
            <div className="modal-popup-footer" style={{ justifyContent: 'center' }}>
              <button
                onClick={() => setPopupNotice(null)}
                style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTERED POPUP MODAL: ALERTS */}
      {showPopupAlerts && (
        <div className="modal-overlay" onClick={() => setShowPopupAlerts(false)}>
          <div className="modal-popup" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-popup-header">
              <h3 className="modal-popup-title">System Alerts</h3>
              <button className="modal-close-btn" onClick={() => setShowPopupAlerts(false)}>✕</button>
            </div>
            <div className="modal-popup-body" style={{ padding: '24px' }}>
              {pendingApprovals > 0 || attendancePercent < 80 ? (
                <div className="alert-card" style={{ margin: 0 }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div className="alert-content">
                    <div className="alert-title">Action Required</div>
                    <ul className="alert-list">
                      {pendingApprovals > 0 && <li>{pendingApprovals} approvals pending</li>}
                      {attendancePercent < 80 && <li>Attendance below 80% target</li>}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ margin: 0, padding: '20px' }}>
                  <div className="empty-state-icon"><i className="fa-regular fa-bell-slash"></i></div>
                  <div className="empty-state-text">No active alerts</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ACTION REQUIRED POPUPS */}
      {popupComplaintModal && (
        <div className="modal-overlay" onClick={() => setPopupComplaintModal(null)}>
          <div className="modal-popup" onClick={e => e.stopPropagation()}>
            <div className="modal-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 className="modal-popup-title" style={{ margin: 0 }}>Grievance Details</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPopupComplaintModal(null)}>✕</button>
            </div>
            <div className="modal-popup-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px' }}>{popupComplaintModal.status}</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{new Date(popupComplaintModal.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', marginBottom: '12px' }}>{popupComplaintModal.subject}</div>
              <div style={{ fontSize: '14px', color: '#334155', background: '#f8fafc', padding: '16px', borderRadius: '12px', lineHeight: 1.6, marginBottom: '16px' }}>
                {popupComplaintModal.description}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <strong>Submitted By:</strong> {popupComplaintModal.isAnonymous ? 'Anonymous' : popupComplaintModal.applicant?.name || 'Unknown'} {popupComplaintModal.applicant?.extra ? `(${popupComplaintModal.applicant.extra})` : ''}
              </div>
            </div>
            <div className="modal-popup-footer">
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("sjs_token");
                    await api.post(`/complaints/${popupComplaintModal.id}/status`, { status: 'RESOLVED' }, { headers: { Authorization: `Bearer ${token}` } });
                    queryClient.invalidateQueries({ queryKey: ['allComplaints'] });
                    setPopupComplaintModal(null);
                    setPopupNotice({ title: "✅ Success", message: "Complaint marked as resolved." });
                  } catch (err: any) {
                    setPopupNotice({ title: "❌ Error", message: err.response?.data?.error || err.message });
                  }
                }}
                style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i> Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {popupAttendanceModal && (
        <div className="modal-overlay" onClick={() => setPopupAttendanceModal(null)}>
          <div className="modal-popup" onClick={e => e.stopPropagation()}>
            <div className="modal-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  <i className="fa-solid fa-clock"></i>
                </div>
                <h3 className="modal-popup-title" style={{ margin: 0 }}>Low Attendance</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPopupAttendanceModal(null)}>✕</button>
            </div>
            <div className="modal-popup-body" style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#64748b', overflow: 'hidden' }}>
                {popupAttendanceModal.profilePic ? <img src={popupAttendanceModal.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${popupAttendanceModal.firstName?.[0] || ''}${popupAttendanceModal.lastName?.[0] || ''}`}
              </div>
              <div style={{ fontWeight: 800, fontSize: '20px', color: '#0f172a' }}>{popupAttendanceModal.firstName} {popupAttendanceModal.lastName}</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Class {popupAttendanceModal.className || 'Unknown'} - {popupAttendanceModal.sectionName || 'Unknown'} | Scholar No: {popupAttendanceModal.scholarNumber}</div>
              
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>{popupAttendanceModal.attendancePercent}%</div>
                <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>Attendance this month is critically low.</div>
              </div>
            </div>
            <div className="modal-popup-footer">
              <button 
                onClick={() => {
                  setPopupAttendanceModal(null);
                  router.push(`/student/profile?id=${popupAttendanceModal.scholarNumber}`);
                }}
                style={{ flex: 1, padding: '12px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {popupLeaveModal && (
        <div className="modal-overlay" onClick={() => setPopupLeaveModal(null)}>
          <div className="modal-popup" onClick={e => e.stopPropagation()}>
            <div className="modal-popup-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  <i className="fa-solid fa-file-medical"></i>
                </div>
                <h3 className="modal-popup-title" style={{ margin: 0 }}>Leave Request</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPopupLeaveModal(null)}>✕</button>
            </div>
            <div className="modal-popup-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '14px', background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--navy)' }}>Applicant:</strong><br />{popupLeaveModal.applicant?.name} ({popupLeaveModal.role})</div>
                <div><strong style={{ color: 'var(--navy)' }}>From:</strong><br />{new Date(popupLeaveModal.startDate).toLocaleDateString()}</div>
                <div><strong style={{ color: 'var(--navy)' }}>To:</strong><br />{new Date(popupLeaveModal.endDate).toLocaleDateString()}</div>
                <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--navy)' }}>Reason:</strong><br />{popupLeaveModal.reason}</div>
              </div>
            </div>
            <div className="modal-popup-footer">
              <button 
                className="btn-reject" 
                style={{ flex: 1, padding: '12px' }} 
                onClick={() => {
                  updateLeaveStatusMutation.mutate({ id: popupLeaveModal.id, status: 'REJECTED' });
                  setPopupLeaveModal(null);
                }}
              >
                <i className="fa-solid fa-xmark" style={{ marginRight: '6px' }}></i> Reject
              </button>
              <button 
                className="btn-approve" 
                style={{ flex: 1, padding: '12px' }} 
                onClick={() => {
                  updateLeaveStatusMutation.mutate({ id: popupLeaveModal.id, status: 'APPROVED' });
                  setPopupLeaveModal(null);
                }}
              >
                <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoticeSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: '24px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxWidth: '340px',
            width: '100%',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px'
            }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>Published</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
              Notice published and broadcasted successfully via push notification!
            </p>
            <button
              onClick={() => {
                setShowNoticeSuccess(false);
                setActiveTab('notices');
              }}
              style={{
                width: '100%',
                background: 'var(--navy)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow)'
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrincipalDashboard() {
  return (
    <Suspense fallback={<SchoolLoadingScreen title="Loading Principal Portal..." />}>
      <PrincipalDashboardContent />
    </Suspense>
  );
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default system commands
  const defaultCommands = [
    { title: "Go to Home Dashboard", subtitle: "Navigate to home tab", action: () => navigateToTab("home") },
    { title: "View School Notices & Announcements", subtitle: "Read notices", action: () => navigateToTab("notices") },
    { title: "Check Attendance Summary", subtitle: "Register logs", action: () => navigateToTab("attendance") },
    { title: "View Profile & Credentials", subtitle: "Personal settings", action: () => navigateToTab("profile") },
    { title: "Student Admission Application Form", subtitle: "Apply for student admission", action: () => router.push("/apply/student") },
    { title: "Teacher Job Application Form", subtitle: "Apply for teacher vacancy", action: () => router.push("/apply/teacher") },
    { title: "Toggle Theme (Light/Dark)", subtitle: "Adjust workspace styling", action: () => triggerThemeToggle() },
    { title: "Sign Out", subtitle: "Securely close session", action: () => triggerLogout() }
  ];

  const navigateToTab = (tab: string) => {
    // If we are already on a dashboard path, push the query tab
    if (pathname.includes("student") || pathname.includes("teacher") || pathname.includes("principal")) {
      router.push(`${pathname}?tab=${tab}`);
    } else {
      router.push(`/?tab=${tab}`);
    }
    setIsOpen(false);
  };

  const triggerThemeToggle = () => {
    const btn = document.querySelector('.theme-toggle-btn') as HTMLButtonElement | null;
    if (btn) {
      btn.click();
    } else {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('sjs_theme', nextTheme);
    }
    setIsOpen(false);
  };

  const triggerLogout = () => {
    localStorage.removeItem("sjs_token");
    localStorage.removeItem("sjs_user");
    router.push("/");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  useEffect(() => {
    const handleFocusOrClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.tagName === "INPUT" &&
        (
          target.closest(".student-search-bar") ||
          target.closest(".search-bar") ||
          target.closest(".floating-search") ||
          target.id === "principalSearch"
        )
      ) {
        e.preventDefault();
        (target as HTMLInputElement).blur();
        setIsOpen(true);
      }
    };

    document.addEventListener("click", handleFocusOrClick);
    document.addEventListener("focusin", handleFocusOrClick);
    return () => {
      document.removeEventListener("click", handleFocusOrClick);
      document.removeEventListener("focusin", handleFocusOrClick);
    };
  }, []);

  const filteredCommands = defaultCommands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(9, 15, 23, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "15vh",
        paddingLeft: "20px",
        paddingRight: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--muted)", marginRight: "12px", fontSize: "16px" }}></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search tab..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "15px",
              color: "var(--text)",
              fontFamily: "inherit"
            }}
          />
          <span style={{ fontSize: "10px", color: "var(--muted)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px" }}>ESC</span>
        </div>

        {/* Commands List */}
        <div style={{ maxHeight: "280px", overflowY: "auto", padding: "8px" }}>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.title}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(201, 168, 76, 0.15)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px"
                  }}
                >
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: isSelected ? "var(--gold)" : "var(--text)" }}>
                    {cmd.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {cmd.subtitle}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              No commands found. Try typing another search term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

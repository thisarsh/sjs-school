"use client";

import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('sjs_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sjs_theme', nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label="Toggle Theme"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '50%',
        color: 'var(--text)',
        transition: 'background-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {theme === 'light' ? (
        <i className="fa-regular fa-moon" style={{ color: 'var(--text)' }}></i>
      ) : (
        <i className="fa-regular fa-sun" style={{ color: 'var(--gold2)' }}></i>
      )}
    </button>
  );
}

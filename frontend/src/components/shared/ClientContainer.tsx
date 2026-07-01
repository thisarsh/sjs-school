"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function ClientContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  if (isLoginPage) {
    return (
      <div className="login-full-screen-wrapper">
        {children}
      </div>
    );
  }

  return (
    <div className="mobile-app-container">
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

const links = [
  { href: "/", label: "Overview" },
  { href: "/attendance", label: "Attendance" },
  { href: "/recitation", label: "Recitation" },
  { href: "/manage/students", label: "Students" },
  { href: "/manage/subjects", label: "Subjects" },
];

export default function AppHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-brand" aria-label="Classroom home">
          <span className="app-brand-mark">C</span>
          <span>Classroom<span className="app-brand-muted">.space</span></span>
        </Link>
        <nav className="app-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="app-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          <span aria-hidden="true">{theme === "light" ? "◐" : "☀"}</span>
          <span className="theme-toggle-label">{theme === "light" ? "Dark" : "Light"}</span>
        </button>
      </div>
    </header>
  );
}

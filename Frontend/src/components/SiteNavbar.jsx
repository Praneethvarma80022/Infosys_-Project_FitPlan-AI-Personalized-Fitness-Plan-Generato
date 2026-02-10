import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/useUser';

const SiteNavbar = () => {
  const { isRegistered, logout } = useUser();
  const navigate = useNavigate();
  const themeStorageKey = 'fitplan_theme';
  const getInitialTheme = () => {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };
  const [theme, setTheme] = useState(getInitialTheme);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const navClass = ({ isActive }) => `site-nav__link${isActive ? ' active' : ''}`;
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <nav className="site-nav">
      <div className="container site-nav__content">
        <Link to="/" className="site-nav__brand">
          <span className="site-nav__logo">FitPlan</span>
          <span className="site-nav__accent">AI</span>
        </Link>

        <div className="site-nav__links">
          {isRegistered ? (
            <>
              <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
              <NavLink to="/plan/overview" className={navClass}>Plan</NavLink>
              <NavLink to="/progress" className={navClass}>Progress</NavLink>
              <NavLink to="/profile" className={navClass}>Profile</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" className={navClass}>Home</NavLink>
              <NavLink to="/login" className={navClass}>Login</NavLink>
              <NavLink to="/register" className={navClass}>Register</NavLink>
            </>
          )}
        </div>

        <div className="site-nav__actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label="Toggle dark mode"
          >
            <span className="theme-toggle__label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          {isRegistered ? (
            <button type="button" className="site-nav__cta" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <Link to="/register" className="site-nav__cta">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SiteNavbar;

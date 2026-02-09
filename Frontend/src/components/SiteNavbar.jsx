import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/useUser';

const SiteNavbar = () => {
  const { isRegistered, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) => `site-nav__link${isActive ? ' active' : ''}`;

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

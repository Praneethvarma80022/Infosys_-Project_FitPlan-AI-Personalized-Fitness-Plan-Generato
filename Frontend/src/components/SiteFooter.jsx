import React from 'react';
import { Link } from 'react-router-dom';

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="container site-footer__content">
      <div>
        <h3 className="site-footer__brand">FitPlan AI</h3>
        <p className="site-footer__tagline">Personalized training, nutrition, and progress guidance.</p>
      </div>
      <div className="site-footer__links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/plan/overview">Plan</Link>
        <Link to="/progress">Progress</Link>
        <Link to="/profile">Profile</Link>
      </div>
      <div className="site-footer__meta">
        <p>Built with care for consistent, sustainable results.</p>
        <p className="site-footer__small">© 2026 FitPlan AI</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;

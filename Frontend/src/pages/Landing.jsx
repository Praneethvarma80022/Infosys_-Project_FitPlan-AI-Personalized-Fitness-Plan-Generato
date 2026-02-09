import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/useUser';
import gymVideo from '../data/GYM.mp4';

const Landing = () => {
  const { isRegistered } = useUser();

  return (
    <div className="landing-page">
      <div className="landing-video" aria-hidden="true">
        <video autoPlay muted loop playsInline>
          <source src={gymVideo} type="video/mp4" />
        </video>
      </div>
      <div className="container landing-page__content">
        <header className="landing-hero">
          <h1>FitPlan AI</h1>
          <p>Your Personal Fitness & Diet Planner</p>
        </header>

        <div className="landing-grid">
          <div className="card">
            <h3 style={{ color: 'var(--fitness-green)', marginBottom: '1rem' }}>
              🎯 Personalized Plans
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>
              Get customized 10-week fitness and diet plans based on your goals, fitness level, and health conditions.
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: 'var(--energy-orange)', marginBottom: '1rem' }}>
              📈 Progressive Training
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>
              Smart progression system that adapts your workout intensity week by week for optimal results.
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: 'var(--fitness-green)', marginBottom: '1rem' }}>
              🍽️ Smart Nutrition
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>
              Meal plans tailored to your dietary preferences, restrictions, and fitness goals.
            </p>
          </div>
        </div>

        <div className="landing-cta">
          {isRegistered ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ 
              fontSize: '1.25rem', 
              padding: '1rem 2rem',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary" style={{ 
              fontSize: '1.25rem', 
              padding: '1rem 2rem',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Start Your Fitness Journey
            </Link>
          )}
        </div>

        <div className="landing-note">
          <p>✨ Rule-based AI • No signup required • Instant results</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
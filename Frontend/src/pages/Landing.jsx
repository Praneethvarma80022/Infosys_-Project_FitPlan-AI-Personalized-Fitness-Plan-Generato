import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/useUser';

const Landing = () => {
  const { isRegistered } = useUser();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)' }}>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            FitPlan AI
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'white', 
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            Your Personal Fitness & Diet Planner
          </p>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '4rem'
        }}>
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

        <div style={{ textAlign: 'center' }}>
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

        <div style={{ 
          marginTop: '4rem', 
          textAlign: 'center',
          color: 'white',
          opacity: 0.8
        }}>
          <p>✨ Rule-based AI • No signup required • Instant results</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
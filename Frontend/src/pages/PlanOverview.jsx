import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/useUser';

const PlanOverview = () => {
  const { user, fitnessData } = useUser();

  if (!user || !fitnessData) {
    return <div>Loading...</div>;
  }

  const weeks = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="page page--light">
      <header className="page-hero page-hero--primary">
        <div className="container page-hero__content">
          <div className="page-hero__title">
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                10-Week Plan Overview
              </h1>
              <p style={{ opacity: 0.9 }}>
                Your complete fitness and nutrition journey
              </p>
            </div>
            <Link to="/dashboard" className="btn" style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              textDecoration: 'none'
            }}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Plan Summary */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Plan Summary</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: 'var(--fitness-green)' }}>Goal</h4>
              <p>{user.fitnessGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: 'var(--energy-orange)' }}>Level</h4>
              <p>{user.fitnessLevel.charAt(0).toUpperCase() + user.fitnessLevel.slice(1)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: 'var(--fitness-green)' }}>Target Calories</h4>
              <p>{fitnessData.targetCalories}/day</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: 'var(--energy-orange)' }}>Duration</h4>
              <p>10 Weeks</p>
            </div>
          </div>
        </div>

        {/* Weekly Timeline */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Weekly Timeline</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem'
          }}>
            {weeks.map(week => {
              const weekData = fitnessData.workoutPlan[`week${week}`];
              const phase = weekData.day1.phase || 'Foundation';
              
              return (
                <div 
                  key={week}
                  className="card" 
                  style={{ 
                    border: week === 1 ? '2px solid var(--fitness-green)' : '1px solid var(--border-light)',
                    backgroundColor: week === 1 ? '#f0fdf4' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4>Week {week}</h4>
                    {week === 1 && (
                      <span style={{ 
                        backgroundColor: 'var(--fitness-green)', 
                        color: 'white', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  
                  <p style={{ color: 'var(--text-gray)', marginBottom: '1rem' }}>
                    Phase: {phase}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link 
                      to={`/plan/workout/${week}/1`}
                      className="btn btn-primary"
                      style={{ 
                        textDecoration: 'none', 
                        fontSize: '0.875rem',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      Workouts
                    </Link>
                    <Link 
                      to={`/plan/diet/${week}`}
                      className="btn btn-secondary"
                      style={{ 
                        textDecoration: 'none', 
                        fontSize: '0.875rem',
                        padding: '0.5rem 1rem'
                      }}
                    >
                      Diet
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Breakdown */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Training Phases</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
              <h4 style={{ color: 'var(--fitness-green)' }}>Weeks 1-2: Foundation</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>
                Building base fitness and establishing routine
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem' }}>
              <h4 style={{ color: 'var(--energy-orange)' }}>Weeks 3-4: Light Progression</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>
                Gradually increasing intensity and complexity
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
              <h4 style={{ color: 'var(--fitness-green)' }}>Weeks 5-6: Moderate Intensity</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>
                Challenging workouts with steady progression
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem' }}>
              <h4 style={{ color: 'var(--energy-orange)' }}>Weeks 7-8: High Intensity</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>
                Advanced training with maximum effort
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
              <h4 style={{ color: 'var(--fitness-green)' }}>Weeks 9-10: Peak Conditioning</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>
                Elite level training for optimal results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanOverview;
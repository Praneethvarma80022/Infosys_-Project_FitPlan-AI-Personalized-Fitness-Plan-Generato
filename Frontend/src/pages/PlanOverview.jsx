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
              <h1 className="page-hero__headline">
                10-Week Plan Overview
              </h1>
              <p className="page-hero__lede">
                Your complete fitness and nutrition journey
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-link">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container section-spacing">
        {/* Plan Summary */}
        <div className="card card--spaced">
          <h3 className="section-title">Plan Summary</h3>
          <div className="overview-summary-grid">
            <div className="overview-summary-item">
              <h4 className="text-accent--green">Goal</h4>
              <p>{user.fitnessGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div className="overview-summary-item">
              <h4 className="text-accent--orange">Level</h4>
              <p>{user.fitnessLevel.charAt(0).toUpperCase() + user.fitnessLevel.slice(1)}</p>
            </div>
            <div className="overview-summary-item">
              <h4 className="text-accent--green">Target Calories</h4>
              <p>{fitnessData.targetCalories}/day</p>
            </div>
            <div className="overview-summary-item">
              <h4 className="text-accent--orange">Duration</h4>
              <p>10 Weeks</p>
            </div>
          </div>
        </div>

        {/* Weekly Timeline */}
        <div className="card">
          <h3 className="section-title">Weekly Timeline</h3>
          <div className="overview-grid">
            {weeks.map(week => {
              const weekData = fitnessData.workoutPlan[`week${week}`];
              const phase = weekData.day1.phase || 'Foundation';
              
              return (
                <div 
                  key={week}
                  className={`card overview-card${week === 1 ? ' is-current' : ''}`}
                >
                  <div className="overview-header">
                    <h4>Week {week}</h4>
                    {week === 1 && (
                      <span className="overview-badge">
                        CURRENT
                      </span>
                    )}
                  </div>
                  
                  <p className="overview-meta">
                    Phase: {phase}
                  </p>
                  
                  <div className="overview-actions">
                    <Link 
                      to={`/plan/workout/${week}/1`}
                      className="btn btn-primary btn-link btn-small"
                    >
                      Workouts
                    </Link>
                    <Link 
                      to={`/plan/diet/${week}`}
                      className="btn btn-secondary btn-link btn-small"
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
        <div className="card card--spaced">
          <h3 className="section-title">Training Phases</h3>
          <div className="phase-grid">
            <div className="phase-card phase-card--green">
              <h4>Weeks 1-2: Foundation</h4>
              <p>
                Building base fitness and establishing routine
              </p>
            </div>
            <div className="phase-card phase-card--orange">
              <h4>Weeks 3-4: Light Progression</h4>
              <p>
                Gradually increasing intensity and complexity
              </p>
            </div>
            <div className="phase-card phase-card--green">
              <h4>Weeks 5-6: Moderate Intensity</h4>
              <p>
                Challenging workouts with steady progression
              </p>
            </div>
            <div className="phase-card phase-card--orange">
              <h4>Weeks 7-8: High Intensity</h4>
              <p>
                Advanced training with maximum effort
              </p>
            </div>
            <div className="phase-card phase-card--green">
              <h4>Weeks 9-10: Peak Conditioning</h4>
              <p>
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
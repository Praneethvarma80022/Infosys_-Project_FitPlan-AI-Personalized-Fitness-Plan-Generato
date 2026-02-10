import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/useUser';
import fatSlimVideo from '../data/fatslim.mp4';
import gymVideo from '../data/GYM.mp4';

const Dashboard = () => {
  const { user, fitnessData, recommendations, fetchRecommendations } = useUser();
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);

  // 1. SAFETY CHECK: If data is missing, show loading instead of crashing
  if (!user || !fitnessData || !fitnessData.workoutPlan) {
    return (
      <div className="page-loader">
        <p className="page-loader__text">Loading your fitness plan...</p>
      </div>
    );
  }

  const currentWeek = 1;
  const currentDay = new Date().getDay() || 7;
  
  // Safe access to nested properties
  const weekData = fitnessData.workoutPlan[`week${currentWeek}`];
  const todaysWorkout = weekData ? weekData[`day${currentDay}`] : null;
  const thisWeeksDiet = fitnessData.dietPlan ? fitnessData.dietPlan[`week${currentWeek}`] : null;

  // Safe access to BMI Category
  // We default to a gray color if bmiCategory is missing to prevent the "reading 'color'" crash
  const bmiCategoryName = fitnessData.bmiCategory?.category || 'Calculating...';
  const bmiRisk = fitnessData.bmiCategory?.risk || 'Unknown';
  const bmiTone = (bmiCategoryName || '').toLowerCase();
  const bmiToneClass = bmiTone.includes('under')
    ? 'bmi-tone--under'
    : bmiTone.includes('normal')
      ? 'bmi-tone--normal'
      : bmiTone.includes('overweight')
        ? 'bmi-tone--over'
        : bmiTone.includes('obese')
          ? 'bmi-tone--obese'
          : 'bmi-tone--neutral';

  const getBMIPosition = (bmi) => {
    const val = parseFloat(bmi || 0);
    if (val < 18.5) return (val / 18.5) * 18.5;
    if (val > 40) return 100;
    return val * 2.5; 
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const startWeight = fitnessData.startWeight || user.weight;
  const targetWeight = fitnessData.targetWeight || user.targetWeight || user.weight;
  const currentWeight = fitnessData.currentWeight || user.weight;
  const goalDelta = startWeight - targetWeight;
  const progressDelta = startWeight - currentWeight;
  const goalPercent = goalDelta > 0 ? Math.min(100, Math.max(0, (progressDelta / goalDelta) * 100)) : 0;

  return (
    <div className="page page--light">
      {/* Header */}
      <header className="page-hero page-hero--dashboard">
        <div className="page-hero__media" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setIsHeroVideoReady(true)}
            onError={() => setIsHeroVideoReady(true)}
          >
            <source src={gymVideo} type="video/mp4" />
          </video>
          <div className="page-hero__media-overlay" />
          {!isHeroVideoReady && (
            <div className="hero-loader" aria-hidden="true">
              <span />
            </div>
          )}
        </div>
        <div className="container page-hero__content">
          <div className="page-hero__title">
            <div>
              <h1 className="page-hero__headline">
                Welcome, {user.fitnessGoal ? user.fitnessGoal.replace('_', ' ') : 'User'}! 👋
              </h1>
              <p className="page-hero__lede">
                Ready for Week {currentWeek} of your journey?
              </p>
            </div>
            <div className="page-hero__actions">
              <Link to="/profile" className="btn btn-ghost btn-link">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container section-spacing dashboard-content">
        {/* Quick Stats */}
        <div className="dashboard-stats">
          <div className="card stat-card">
            <h3 className="stat-value stat-value--green">{currentWeek}/10</h3>
            <p className="stat-label">Weeks Completed</p>
          </div>
          <div className="card stat-card">
            <h3 className="stat-value stat-value--orange">{fitnessData.targetCalories}</h3>
            <p className="stat-label">Daily Calories</p>
          </div>
          <div className="card stat-card">
            <h3 className="stat-value stat-value--green">{fitnessData.bmi}</h3>
            <p className="stat-label">BMI Score</p>
          </div>
        </div>

        {/* BMI Health Indicator - FIXED CRASH HERE */}
        <div className="card bmi-card card--spaced">
          <h3 className="section-title">📊 Health Assessment</h3>
          <div className="bmi-summary-grid">
            <div className="bmi-summary-item">
              <h4 className={`bmi-summary-value ${bmiToneClass}`}>{fitnessData.bmi}</h4>
              <p className="bmi-summary-label">BMI</p>
            </div>
            <div className="bmi-summary-item">
              <h4 className={`bmi-summary-value ${bmiToneClass}`}>{bmiCategoryName}</h4>
              <p className="bmi-summary-label">Category</p>
            </div>
            <div className="bmi-summary-item">
              <h4 className={`bmi-summary-value ${bmiToneClass}`}>{bmiRisk} Risk</h4>
              <p className="bmi-summary-label">Health Risk</p>
            </div>
          </div>
          <div>
            <h4 className="bmi-scale__title">BMI Scale</h4>
            <progress className="bmi-scale" max="100" value={getBMIPosition(fitnessData.bmi)} />
            <div className="bmi-labels">
              <span>Underweight<br />&lt;18.5</span>
              <span>Normal<br />18.5-24.9</span>
              <span>Overweight<br />25-29.9</span>
              <span>Obese<br />30-34.9</span>
              <span>Extremely Obese<br />≥35</span>
            </div>
          </div>
        </div>

        {/* Workout & Diet Section */}
        <div className="dashboard-grid">
          
          {/* Workout Card */}
          <div className="card">
            <h3 className="card-title card-title--green">🏋️ Today's Workout</h3>
            {todaysWorkout ? (
              <div>
                <p className="workout-title">{todaysWorkout.title}</p>
                <p className="card-subtitle">{todaysWorkout.description || `Phase: ${todaysWorkout.phase}`}</p>
                <Link to={`/plan/workout/${currentWeek}/${currentDay}`} className="btn btn-primary btn-link">
                  Start Workout
                </Link>
              </div>
            ) : (
              <p>No workout scheduled today.</p>
            )}
          </div>

          {/* Diet Card */}
          <div className="card">
            <h3 className="card-title card-title--orange">🍽️ Today's Meals</h3>
            {thisWeeksDiet && thisWeeksDiet[`day${currentDay}`] ? (
              <div>
                <ul className="meal-list">
                  <li><strong>☕ Breakfast:</strong> {thisWeeksDiet[`day${currentDay}`].meals.breakfast.name}</li>
                  <li><strong>🥗 Lunch:</strong> {thisWeeksDiet[`day${currentDay}`].meals.lunch.name}</li>
                  <li><strong>🌙 Dinner:</strong> {thisWeeksDiet[`day${currentDay}`].meals.dinner.name}</li>
                </ul>
                <Link to={`/plan/diet/${currentWeek}`} className="btn btn-secondary btn-link">
                  View Full Diet
                </Link>
              </div>
            ) : (
              <p>No diet plan loaded.</p>
            )}
          </div>
        </div>

        <div className="dashboard-panels">
          <div className="card">
            <h3 className="section-title">🎯 Goal Completion</h3>
            <div className="goal-header">
              <span>{startWeight} kg → {targetWeight} kg</span>
              <span>{goalPercent.toFixed(0)}%</span>
            </div>
            <progress className="progress-bar" max="100" value={goalPercent} />
            <p className="goal-note">
              Remaining: {Math.max(0, currentWeight - targetWeight)} kg
            </p>
          </div>

          <div className="card">
            <h3 className="section-title">🩺 Health Guidance</h3>
            {recommendations ? (
              <div>
                {recommendations.alerts?.length > 0 && (
                  <div className="recommendations-alerts">
                    {recommendations.alerts.map((alert, index) => (
                      <p key={index}>⚠️ {alert}</p>
                    ))}
                  </div>
                )}
                <p className="recommendations-label">Safe Workouts</p>
                <p className="recommendations-text">
                  {recommendations.safeWorkouts?.length > 0 ? recommendations.safeWorkouts.join(', ') : 'Standard plan is safe.'}
                </p>
                <p className="recommendations-label">Diet Focus</p>
                <p className="recommendations-text">
                  {recommendations.dietRestrictions?.length > 0 ? recommendations.dietRestrictions.join(', ') : 'Balanced intake recommended.'}
                </p>
              </div>
            ) : (
              <p className="card-subtitle">Loading recommendations...</p>
            )}
          </div>

          <div className="card body-transform-card">
            <div className="body-transform__header">
              <h3 className="section-title">🌟 Body Transformation</h3>
              <span className="body-transform__label">Week {currentWeek} → 10</span>
            </div>
            <p className="card-subtitle">
              Stay consistent. Small steps create visible change over time.
            </p>
            <div className="body-transform">
              <video className="body-transform__video" autoPlay muted loop playsInline>
                <source src={fatSlimVideo} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/plan/overview" className="btn btn-muted btn-link">View Full Plan</Link>
            <Link to="/progress" className="btn btn-muted btn-link">Check Progress</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
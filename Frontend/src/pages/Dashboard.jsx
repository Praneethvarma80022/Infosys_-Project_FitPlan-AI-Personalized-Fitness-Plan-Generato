import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/useUser';

const Dashboard = () => {
  const { user, fitnessData, logout, recommendations, fetchRecommendations } = useUser();
  const navigate = useNavigate();

  // 1. SAFETY CHECK: If data is missing, show loading instead of crashing
  if (!user || !fitnessData || !fitnessData.workoutPlan) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading your fitness plan...</p>
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
  const bmiColor = fitnessData.bmiCategory?.color || '#6b7280';
  const bmiCategoryName = fitnessData.bmiCategory?.category || 'Calculating...';
  const bmiRisk = fitnessData.bmiCategory?.risk || 'Unknown';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, var(--fitness-green), var(--energy-orange))',
        color: 'white',
        padding: '2rem 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Welcome, {user.fitnessGoal ? user.fitnessGoal.replace('_', ' ') : 'User'}! 👋
              </h1>
              <p style={{ opacity: 0.9 }}>
                Ready for Week {currentWeek} of your journey?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/profile" className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none' }}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'white', color: '#dc2626', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--fitness-green)', fontSize: '2rem' }}>{currentWeek}/10</h3>
            <p style={{ color: 'var(--text-gray)' }}>Weeks Completed</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--energy-orange)', fontSize: '2rem' }}>{fitnessData.targetCalories}</h3>
            <p style={{ color: 'var(--text-gray)' }}>Daily Calories</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--fitness-green)', fontSize: '2rem' }}>{fitnessData.bmi}</h3>
            <p style={{ color: 'var(--text-gray)' }}>BMI Score</p>
          </div>
        </div>

        {/* BMI Health Indicator - FIXED CRASH HERE */}
        <div className="card bmi-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-dark)' }}>📊 Health Assessment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: bmiColor, fontSize: '2rem', marginBottom: '0.25rem' }}>{fitnessData.bmi}</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>BMI</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: bmiColor, fontSize: '1.25rem', marginBottom: '0.25rem' }}>{bmiCategoryName}</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>Category</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: bmiColor, fontSize: '1.25rem', marginBottom: '0.25rem' }}>{bmiRisk} Risk</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>Health Risk</p>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>BMI Scale</h4>
            <div className="bmi-scale">
              <div className="bmi-indicator" style={{ left: `${getBMIPosition(fitnessData.bmi)}%` }}></div>
            </div>
            <div className="bmi-labels">
              <span>Underweight<br/>&lt;18.5</span>
              <span>Normal<br/>18.5-24.9</span>
              <span>Overweight<br/>25-29.9</span>
              <span>Obese<br/>30-34.9</span>
              <span>Extremely Obese<br/>≥35</span>
            </div>
          </div>
        </div>

        {/* Workout & Diet Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Workout Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--fitness-green)' }}>🏋️ Today's Workout</h3>
            {todaysWorkout ? (
              <div>
                <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{todaysWorkout.title}</p>
                <p style={{ color: 'var(--text-gray)', marginBottom: '1rem' }}>{todaysWorkout.description || `Phase: ${todaysWorkout.phase}`}</p>
                <Link to={`/plan/workout/${currentWeek}/${currentDay}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Start Workout
                </Link>
              </div>
            ) : (
              <p>No workout scheduled today.</p>
            )}
          </div>

          {/* Diet Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--energy-orange)' }}>🍽️ Today's Meals</h3>
            {thisWeeksDiet && thisWeeksDiet[`day${currentDay}`] ? (
              <div>
                <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
                  <li style={{marginBottom: '0.5rem'}}><strong>☕ Breakfast:</strong> {thisWeeksDiet[`day${currentDay}`].meals.breakfast.name}</li>
                  <li style={{marginBottom: '0.5rem'}}><strong>🥗 Lunch:</strong> {thisWeeksDiet[`day${currentDay}`].meals.lunch.name}</li>
                  <li><strong>🌙 Dinner:</strong> {thisWeeksDiet[`day${currentDay}`].meals.dinner.name}</li>
                </ul>
                <Link to={`/plan/diet/${currentWeek}`} className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  View Full Diet
                </Link>
              </div>
            ) : (
              <p>No diet plan loaded.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>🎯 Goal Completion</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{startWeight} kg → {targetWeight} kg</span>
              <span>{goalPercent.toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${goalPercent}%` }}></div>
            </div>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-gray)' }}>
              Remaining: {Math.max(0, currentWeight - targetWeight)} kg
            </p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>🩺 Health Guidance</h3>
            {recommendations ? (
              <div>
                {recommendations.alerts?.length > 0 && (
                  <div style={{ marginBottom: '1rem', color: '#b91c1c' }}>
                    {recommendations.alerts.map((alert, index) => (
                      <p key={index}>⚠️ {alert}</p>
                    ))}
                  </div>
                )}
                <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Safe Workouts</p>
                <p style={{ color: 'var(--text-gray)', marginBottom: '1rem' }}>
                  {recommendations.safeWorkouts?.length > 0 ? recommendations.safeWorkouts.join(', ') : 'Standard plan is safe.'}
                </p>
                <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Diet Focus</p>
                <p style={{ color: 'var(--text-gray)' }}>
                  {recommendations.dietRestrictions?.length > 0 ? recommendations.dietRestrictions.join(', ') : 'Balanced intake recommended.'}
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-gray)' }}>Loading recommendations...</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/plan/overview" className="btn" style={{background:'#e5e7eb', textDecoration:'none', color:'black'}}>View Full Plan</Link>
            <Link to="/progress" className="btn" style={{background:'#e5e7eb', textDecoration:'none', color:'black'}}>Check Progress</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
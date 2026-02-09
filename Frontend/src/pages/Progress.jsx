import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/useUser';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Progress = () => {
  const { user, fitnessData, progressSummary, predictions, fetchProgressSummary, fetchPredictions, logFeedback } = useUser();
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackResult, setFeedbackResult] = useState(null);

  if (!user || !fitnessData) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    fetchProgressSummary();
    fetchPredictions();
  }, []);

  const currentWeek = 1;
  const totalWorkouts = 70; // 10 weeks * 7 days
  const completedWorkouts = progressSummary?.workoutCompletion?.completed || 0;
  const progressPercentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

  const startWeight = progressSummary?.profile?.startWeight || fitnessData.startWeight || user.weight;
  const currentWeight = progressSummary?.profile?.currentWeight || user.weight;
  const targetWeight = progressSummary?.profile?.targetWeight || user.targetWeight || user.weight;
  const weightChange = Number((currentWeight - startWeight).toFixed(1));
  const goalDelta = startWeight - targetWeight;
  const progressDelta = startWeight - currentWeight;
  const goalPercent = goalDelta > 0 ? Math.min(100, Math.max(0, (progressDelta / goalDelta) * 100)) : 0;

  const height = progressSummary?.profile?.height || user.height;

  const progressRows = progressSummary?.progress || [];
  const startDate = fitnessData?.startDate || new Date().toISOString().slice(0, 10);
  const chartColors = {
    green: '#22c55e',
    orange: '#f97316',
    gray: '#9ca3af'
  };

  const weightHistory = useMemo(() => {
    if (progressRows.length > 0) {
      return progressRows.map(row => ({
        date: row.logged_date,
        value: row.weight_kg
      }));
    }

    return [
      { date: startDate, value: startWeight },
      { date: new Date().toISOString().slice(0, 10), value: currentWeight }
    ];
  }, [progressRows, startWeight, currentWeight, startDate]);

  const bmiHistory = useMemo(() => {
    if (progressRows.length > 0 && progressRows.some(row => row.bmi)) {
      return progressRows.map(row => ({
        date: row.logged_date,
        value: row.bmi
      }));
    }
    if (!height) return [];
    return weightHistory.map(entry => ({
      date: entry.date,
      value: Number((entry.value / ((height / 100) * (height / 100))).toFixed(1))
    }));
  }, [progressRows, weightHistory, height]);

  const caloriesSeries = useMemo(() => {
    const map = progressSummary?.caloriesByDate || {};
    const labels = Object.keys(map).sort();
    return {
      labels,
      values: labels.map(label => map[label])
    };
  }, [progressSummary]);

  const performanceSeries = useMemo(() => {
    const labels = progressRows.map(row => row.logged_date);
    const values = progressRows.map(row => row.performance_score || row.workout_minutes || 0);
    return { labels, values };
  }, [progressRows]);

  const predictionSeries = useMemo(() => {
    const trend = predictions?.trend || [];
    return {
      labels: trend.map(point => point.date),
      values: trend.map(point => point.weight)
    };
  }, [predictions]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    const result = await logFeedback({ moodText: feedbackText });
    setFeedbackResult(result);
    setFeedbackText('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, var(--fitness-green), var(--energy-orange))',
        color: 'white',
        padding: '2rem 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                Progress Tracking
              </h1>
              <p style={{ opacity: 0.9 }}>
                Monitor your fitness journey and achievements
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
        {/* Overall Progress */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Overall Progress</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Program Completion</span>
              <span>{currentWeek}/10 weeks ({Math.round((currentWeek/10) * 100)}%)</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentWeek/10) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Workouts Completed</span>
              <span>{completedWorkouts}/{totalWorkouts} ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Goal Completion</span>
              <span>{goalPercent.toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${goalPercent}%` }}
              ></div>
            </div>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-gray)' }}>
              {startWeight} kg → {targetWeight} kg, remaining {Math.max(0, currentWeight - targetWeight)} kg
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--fitness-green)', fontSize: '2rem' }}>
              {currentWeight}kg
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>Current Weight</p>
            <p style={{ fontSize: '0.875rem', color: weightChange >= 0 ? 'var(--energy-orange)' : 'var(--fitness-green)' }}>
              {weightChange >= 0 ? '+' : ''}{weightChange}kg from start
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--energy-orange)', fontSize: '2rem' }}>
              {completedWorkouts}
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>Workouts Done</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
              {totalWorkouts - completedWorkouts} remaining
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--fitness-green)', fontSize: '2rem' }}>
              {caloriesSeries.values.reduce((sum, value) => sum + value, 0)}
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>Calories Burned</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
              Total from workouts
            </p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--energy-orange)', fontSize: '2rem' }}>
              {fitnessData.targetCalories}
            </h3>
            <p style={{ color: 'var(--text-gray)' }}>Daily Calories</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
              Target intake
            </p>
          </div>
        </div>

        {/* Visualization Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>📈 Weight Progress</h3>
            <Line
              data={{
                labels: weightHistory.map(entry => entry.date),
                datasets: [
                  {
                    label: 'Weight (kg)',
                    data: weightHistory.map(entry => entry.value),
                    borderColor: chartColors.green,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.3
                  }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>📊 BMI Progress</h3>
            <Line
              data={{
                labels: bmiHistory.map(entry => entry.date),
                datasets: [
                  {
                    label: 'BMI',
                    data: bmiHistory.map(entry => entry.value),
                    borderColor: chartColors.orange,
                    backgroundColor: 'rgba(249, 115, 22, 0.12)',
                    tension: 0.3
                  }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>🔥 Calories Burned</h3>
            <Bar
              data={{
                labels: caloriesSeries.labels,
                datasets: [
                  {
                    label: 'Calories',
                    data: caloriesSeries.values,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)'
                  }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>✅ Workout Consistency</h3>
            <Bar
              data={{
                labels: ['Completed', 'Remaining'],
                datasets: [
                  {
                    label: 'Workouts',
                    data: [completedWorkouts, Math.max(0, totalWorkouts - completedWorkouts)],
                    backgroundColor: [chartColors.green, chartColors.gray]
                  }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>🏋️ Exercise Performance</h3>
            <Line
              data={{
                labels: performanceSeries.labels,
                datasets: [
                  {
                    label: 'Performance',
                    data: performanceSeries.values,
                    borderColor: chartColors.green,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.3
                  }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>🔮 Prediction Trend</h3>
            <Line
              data={{
                labels: predictionSeries.labels,
                datasets: [
                  {
                    label: 'Predicted Weight',
                    data: predictionSeries.values,
                    borderColor: chartColors.orange,
                    backgroundColor: 'rgba(249, 115, 22, 0.12)',
                    borderDash: [6, 6],
                    tension: 0.3
                  }
                ]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-gray)' }}>
              Predicted target date: {predictions?.predictedTargetDate || 'Not enough data yet'}
            </p>
          </div>
        </div>

        {/* Before vs After Comparison */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>📷 Before vs After Comparison</h3>
          <Bar
            data={{
              labels: ['Start', 'Current', 'Target'],
              datasets: [
                {
                  label: 'Weight (kg)',
                  data: [startWeight, currentWeight, targetWeight],
                  backgroundColor: [chartColors.gray, chartColors.green, chartColors.orange]
                }
              ]
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        {/* Weekly Breakdown */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Weekly Breakdown</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem'
          }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(week => {
              const isCompleted = week < currentWeek;
              const isCurrent = week === currentWeek;
              const isUpcoming = week > currentWeek;
              
              return (
                <div 
                  key={week}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    backgroundColor: isCompleted ? '#f0fdf4' : isCurrent ? '#fff7ed' : '#f9fafb',
                    border: `2px solid ${isCompleted ? 'var(--fitness-green)' : isCurrent ? 'var(--energy-orange)' : 'var(--border-light)'}`
                  }}
                >
                  <h4>Week {week}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                    {isCompleted ? '✅ Completed' : isCurrent ? '🔄 In Progress' : '⏳ Upcoming'}
                  </p>
                  {isCompleted && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--fitness-green)' }}>
                      7/7 workouts
                    </p>
                  )}
                  {isCurrent && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--energy-orange)' }}>
                      0/7 workouts
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Analysis & Feedback */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🧠 Daily Mood & Feedback</h3>
          <form onSubmit={handleFeedbackSubmit}>
            <div className="form-group">
              <label className="form-label">How do you feel today?</label>
              <input
                type="text"
                className="form-input"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Example: tired but motivated"
              />
            </div>
            <button type="submit" className="btn btn-primary">Analyze Mood</button>
          </form>
          {feedbackResult && (
            <div style={{ marginTop: '1rem' }}>
              <p>Sentiment: <strong>{feedbackResult.sentiment}</strong></p>
              <p>Suggested Intensity: <strong>{feedbackResult.intensity}</strong></p>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🏆 Achievements</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
              opacity: 0.6
            }}>
              <h4>🎯 First Week Complete</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Complete your first week of training
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                Not yet achieved
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
              opacity: 0.6
            }}>
              <h4>💪 Strength Builder</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Complete 10 strength training sessions
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                0/10 sessions
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
              opacity: 0.6
            }}>
              <h4>🔥 Calorie Crusher</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Burn 1000 calories through workouts
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                {caloriesSeries.values.reduce((sum, value) => sum + value, 0)}/1000 calories
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
              opacity: 0.6
            }}>
              <h4>🏃 Consistency Champion</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Complete 7 consecutive days of workouts
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                Not yet achieved
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🎯 Next Steps</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem'
          }}>
            <Link 
              to={`/plan/workout/${currentWeek}/1`}
              className="btn btn-primary"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Start Today's Workout
            </Link>
            <Link 
              to={`/plan/diet/${currentWeek}`}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              View Diet Plan
            </Link>
            <Link 
              to="/plan/overview"
              className="btn"
              style={{ 
                backgroundColor: 'var(--text-gray)', 
                color: 'white',
                textDecoration: 'none', 
                textAlign: 'center' 
              }}
            >
              Plan Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
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
  const [themeMode, setThemeMode] = useState(() => (
    typeof document !== 'undefined' && document.body.classList.contains('dark-theme')
      ? 'dark'
      : 'light'
  ));

  if (!user || !fitnessData) {
    return (
      <div className="page-loader">
        <p className="page-loader__text">Loading...</p>
      </div>
    );
  }

  useEffect(() => {
    fetchProgressSummary();
    fetchPredictions();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const observer = new MutationObserver(() => {
      setThemeMode(document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleRefresh = () => fetchProgressSummary();
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    const handleActivityUpdate = () => {
      fetchProgressSummary();
    };
    window.addEventListener('fitplan-activity-updated', handleActivityUpdate);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener('fitplan-activity-updated', handleActivityUpdate);
    };
  }, [fetchProgressSummary]);

  const totalWorkouts = 70; // 10 weeks * 7 days
  const completedWorkouts = progressSummary?.workoutCompletion?.completed || 0;
  const backendWorkoutByWeek = progressSummary?.workoutByWeek || {};
  const backendMealsByWeek = progressSummary?.mealByWeek || {};
  const backendMealsCompleted = progressSummary?.mealCompletion?.completed || 0;
  const mergedCompletedWorkouts = completedWorkouts;
  const mergedMealsCompleted = backendMealsCompleted;
  const progressPercentage = totalWorkouts > 0 ? (mergedCompletedWorkouts / totalWorkouts) * 100 : 0;
  const totalMeals = 10 * 7 * 4;
  const mealProgressPercentage = totalMeals > 0 ? (mergedMealsCompleted / totalMeals) * 100 : 0;

  const weeklyStats = useMemo(() => {
    const stats = {};
    for (let week = 1; week <= 10; week += 1) {
      const workouts = backendWorkoutByWeek[week] || 0;
      const meals = backendMealsByWeek[week] || 0;
      stats[week] = {
        workouts,
        meals,
        isComplete: workouts >= 7 && meals >= 28
      };
    }
    return stats;
  }, [backendWorkoutByWeek, backendMealsByWeek]);

  const exerciseStats = useMemo(() => {
    const completion = progressSummary?.exerciseCompletion || {};
    return {
      completed: completion.completed || 0,
      total: completion.total || 0
    };
  }, [progressSummary]);

  const currentWeek = useMemo(() => {
    for (let week = 1; week <= 10; week += 1) {
      if (!weeklyStats[week]?.isComplete) return week;
    }
    return 10;
  }, [weeklyStats]);
  const weekProgress = progressSummary?.weekProgress || {};

  const startWeight = progressSummary?.profile?.startWeight || fitnessData.startWeight || user.weight;
  const currentWeight = progressSummary?.profile?.currentWeight || user.weight;
  const targetWeight = progressSummary?.profile?.targetWeight || user.targetWeight || user.weight;
  const weightChange = Number((currentWeight - startWeight).toFixed(1));
  const goalDelta = startWeight - targetWeight;
  const progressDelta = startWeight - currentWeight;
  const goalPercent = goalDelta > 0 ? Math.min(100, Math.max(0, (progressDelta / goalDelta) * 100)) : 0;

  const height = progressSummary?.profile?.height || user.height;

  const progressRows = progressSummary?.progress || [];
  const profileHistory = progressSummary?.profileHistory || [];
  const startDate = fitnessData?.startDate || new Date().toISOString().slice(0, 10);
  const chartColors = {
    green: '#22c55e',
    orange: '#f97316',
    gray: '#9ca3af'
  };
  const mockLabels = useMemo(() => (
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  ), []);
  const mockWeight = useMemo(() => (
    [startWeight, startWeight - 0.2, startWeight - 0.3, startWeight - 0.4, startWeight - 0.5, startWeight - 0.6, currentWeight]
  ), [startWeight, currentWeight]);
  const chartAxisColor = themeMode === 'dark' ? '#e5e7eb' : '#1f2937';
  const chartGridColor = themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const baseChartScales = useMemo(() => ({
    x: {
      ticks: { color: chartAxisColor },
      grid: { color: chartGridColor }
    },
    y: {
      ticks: { color: chartAxisColor },
      grid: { color: chartGridColor },
      beginAtZero: true
    }
  }), [chartAxisColor, chartGridColor]);
  const baseChartOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: baseChartScales
  }), [baseChartScales]);

  const weightHistory = useMemo(() => {
    if (profileHistory.length > 0) {
      const entries = profileHistory
        .map(row => ({
          date: String(row.updated_at).slice(0, 10),
          value: row.weight_kg
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length === 1) {
        return [
          { date: startDate, value: startWeight },
          entries[0]
        ];
      }
      const first = entries[0];
      if (first && first.value !== startWeight) {
        return [{ date: startDate, value: startWeight }, ...entries];
      }
      return entries;
    }
    if (progressRows.length > 0) {
      const entries = progressRows.map(row => ({
        date: row.logged_date,
        value: row.weight_kg
      }));
      if (entries.length === 1) {
        const only = entries[0];
        return [
          { date: startDate, value: startWeight },
          { date: only.date, value: only.value }
        ];
      }
      return entries;
    }
    return [
      { date: startDate, value: startWeight },
      { date: new Date().toISOString().slice(0, 10), value: currentWeight }
    ];
  }, [profileHistory, progressRows, startDate, startWeight, currentWeight]);

  const bmiHistory = useMemo(() => {
    if (profileHistory.length > 0) {
      const entries = profileHistory
        .filter(row => row.bmi !== null && row.bmi !== undefined)
        .map(row => ({
          date: String(row.updated_at).slice(0, 10),
          value: row.bmi
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length > 0) {
        if (entries.length === 1 && height) {
          return [
            {
              date: startDate,
              value: Number((startWeight / ((height / 100) * (height / 100))).toFixed(1))
            },
            entries[0]
          ];
        }
        if (height) {
          const startBmi = Number((startWeight / ((height / 100) * (height / 100))).toFixed(1));
          const first = entries[0];
          if (first && first.value !== startBmi) {
            return [{ date: startDate, value: startBmi }, ...entries];
          }
        }
        return entries;
      }
    }
    if (progressRows.length > 0 && progressRows.some(row => row.bmi)) {
      const entries = progressRows.map(row => ({
        date: row.logged_date,
        value: row.bmi
      }));
      if (entries.length === 1 && height) {
        return [
          {
            date: startDate,
            value: Number((startWeight / ((height / 100) * (height / 100))).toFixed(1))
          },
          entries[0]
        ];
      }
      return entries;
    }
    if (!height) return [];
    return weightHistory.map(entry => ({
      date: entry.date,
      value: Number((entry.value / ((height / 100) * (height / 100))).toFixed(1))
    }));
  }, [profileHistory, progressRows, height, weightHistory, startDate, startWeight]);

  const caloriesSeries = useMemo(() => {
    const map = progressSummary?.caloriesByDate || {};
    const labels = Object.keys(map).sort();
    if (labels.length > 0) {
      return {
        labels,
        values: labels.map(label => map[label])
      };
    }
    return {
      labels: mockLabels,
      values: [220, 280, 260, 310, 290, 340, 300]
    };
  }, [progressSummary, mockLabels]);

  const performanceSeries = useMemo(() => {
    const performanceMap = progressSummary?.performanceByDate || {};
    const backendLabels = Object.keys(performanceMap).sort();
    if (backendLabels.length > 0) {
      return {
        labels: backendLabels,
        values: backendLabels.map(label => performanceMap[label])
      };
    }
    const labels = progressRows.map(row => row.logged_date);
    const values = progressRows.map(row => row.performance_score || row.workout_minutes || 0);
    if (labels.length > 0) return { labels, values };
    return {
      labels: mockLabels,
      values: [6, 7, 7, 8, 6, 8, 9]
    };
  }, [progressSummary, progressRows, mockLabels]);

  const predictionSeries = useMemo(() => {
    const trend = predictions?.trend || [];
    if (trend.length > 0) {
      return {
        labels: trend.map(point => point.date),
        values: trend.map(point => point.weight)
      };
    }
    return {
      labels: mockLabels,
      values: mockWeight.map(value => Number((value - 0.3).toFixed(1)))
    };
  }, [predictions, mockLabels, mockWeight]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    const result = await logFeedback({ moodText: feedbackText });
    setFeedbackResult(result);
    setFeedbackText('');
  };

  return (
    <div className="page page--light">
      <header className="page-hero page-hero--primary">
        <div className="container page-hero__content">
          <div className="page-hero__title">
            <div>
              <h1 className="page-hero__headline">
                Progress Tracking
              </h1>
              <p className="page-hero__lede">
                Monitor your fitness journey and achievements
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-link">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container section-spacing">
        {/* Overall Progress */}
        <div className="card progress-overall card--spaced">
          <h3 className="section-title">Overall Progress</h3>
          <div className="progress-row">
            <div className="progress-row__header">
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
          
          <div className="progress-row">
            <div className="progress-row__header">
              <span>Workouts Completed</span>
              <span>{mergedCompletedWorkouts}/{totalWorkouts} ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="progress-row">
            <div className="progress-row__header">
              <span>Meals Logged</span>
              <span>{mergedMealsCompleted}/{totalMeals} ({Math.round(mealProgressPercentage)}%)</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${mealProgressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="progress-row">
            <div className="progress-row__header">
              <span>Goal Completion</span>
              <span>{goalPercent.toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${goalPercent}%` }}
              ></div>
            </div>
            <p className="progress-row__note">
              {startWeight} kg → {targetWeight} kg, remaining {Math.max(0, currentWeight - targetWeight)} kg
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="progress-metrics">
          <div className="card metric-card">
            <h3 className="metric-value metric-value--green">
              {currentWeight}kg
            </h3>
            <p className="metric-label">Current Weight</p>
            <p className={`metric-sub ${weightChange >= 0 ? 'metric-sub--warn' : 'metric-sub--accent'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange}kg from start
            </p>
          </div>
          
          <div className="card metric-card">
            <h3 className="metric-value metric-value--orange">
              {mergedCompletedWorkouts}
            </h3>
            <p className="metric-label">Workouts Done</p>
            <p className="metric-sub">
              {Math.max(0, totalWorkouts - mergedCompletedWorkouts)} remaining
            </p>
          </div>

          <div className="card metric-card">
            <h3 className="metric-value metric-value--green">
              {exerciseStats.completed}
            </h3>
            <p className="metric-label">Exercises Done</p>
            <p className="metric-sub">
              {Math.max(0, exerciseStats.total - exerciseStats.completed)} remaining
            </p>
          </div>
          
          <div className="card metric-card">
            <h3 className="metric-value metric-value--green">
              {caloriesSeries.values.reduce((sum, value) => sum + value, 0)}
            </h3>
            <p className="metric-label">Calories Burned</p>
            <p className="metric-sub">
              Total from workouts
            </p>
          </div>
          
          <div className="card metric-card">
            <h3 className="metric-value metric-value--orange">
              {fitnessData.targetCalories}
            </h3>
            <p className="metric-label">Daily Calories</p>
            <p className="metric-sub">
              Target intake
            </p>
          </div>
        </div>

        {/* Visualization Dashboard */}
        <div className="progress-charts">
          <div className="card chart-card">
            <h3 className="chart-title">📈 Weight Progress</h3>
            <Line
              data={{
                labels: weightHistory.map(entry => entry.date),
                datasets: [
                  {
                    label: 'Weight (kg)',
                    data: weightHistory.map(entry => entry.value),
                    borderColor: chartColors.green,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                  }
                ]
              }}
              options={baseChartOptions}
            />
          </div>

          <div className="card chart-card">
            <h3 className="chart-title">📊 BMI Progress</h3>
            <Line
              data={{
                labels: bmiHistory.map(entry => entry.date),
                datasets: [
                  {
                    label: 'BMI',
                    data: bmiHistory.map(entry => entry.value),
                    borderColor: chartColors.orange,
                    backgroundColor: 'rgba(249, 115, 22, 0.12)',
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                  }
                ]
              }}
              options={baseChartOptions}
            />
          </div>

          <div className="card chart-card">
            <h3 className="chart-title">🔥 Calories Burned</h3>
            <Bar
              data={{
                labels: caloriesSeries.labels,
                datasets: [
                  {
                    label: 'Calories',
                    data: caloriesSeries.values,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderRadius: 8,
                    borderSkipped: false
                  }
                ]
              }}
              options={baseChartOptions}
            />
          </div>

          <div className="card chart-card">
            <h3 className="chart-title">✅ Workout Consistency</h3>
            <Bar
              data={{
                labels: ['Completed', 'Remaining'],
                datasets: [
                  {
                    label: 'Workouts',
                    data: [mergedCompletedWorkouts, Math.max(0, totalWorkouts - mergedCompletedWorkouts)],
                    backgroundColor: [chartColors.green, chartColors.gray],
                    borderRadius: 8,
                    borderSkipped: false
                  }
                ]
              }}
              options={baseChartOptions}
            />
          </div>

          <div className="card chart-card">
            <h3 className="chart-title">🧾 Activity Completion</h3>
            <Bar
              data={{
                labels: ['Workouts', 'Meals'],
                datasets: [
                  {
                    label: 'Completed',
                    data: [mergedCompletedWorkouts, mergedMealsCompleted],
                    backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(249, 115, 22, 0.6)'],
                    borderRadius: 8,
                    borderSkipped: false
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  ...baseChartScales,
                  y: {
                    ...baseChartScales.y,
                    suggestedMax: Math.max(totalWorkouts, totalMeals)
                  }
                }
              }}
            />
          </div>

          <div className="card chart-card">
            <h3 className="chart-title">🏋️ Exercise Performance</h3>
            <Line
              data={{
                labels: performanceSeries.labels,
                datasets: [
                  {
                    label: 'Performance',
                    data: performanceSeries.values,
                    borderColor: chartColors.green,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                  }
                ]
              }}
              options={baseChartOptions}
            />
          </div>

        </div>

        <div className="progress-compare-row">
          <div className="card chart-card progress-prediction">
            <h3 className="chart-title">🔮 Prediction Trend</h3>
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
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                  }
                ]
              }}
              options={baseChartOptions}
            />
          </div>

          {/* Before vs After Comparison */}
          <div className="card progress-compare">
            <h3 className="section-title">📷 Before vs After Comparison</h3>
            <div className="progress-compare__chart">
              <Bar
                data={{
                  labels: ['Start', 'Current', 'Target'],
                  datasets: [
                    {
                      label: 'Weight (kg)',
                      data: [startWeight, currentWeight, targetWeight],
                      backgroundColor: [chartColors.gray, chartColors.green, chartColors.orange],
                      borderRadius: 8,
                      borderSkipped: false
                    }
                  ]
                }}
                options={baseChartOptions}
              />
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="card progress-weekly card--spaced">
          <h3 className="section-title">Weekly Breakdown</h3>
          <div className="weekly-grid">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(week => {
              const weekStats = weeklyStats[week] || { workouts: 0, meals: 0, isComplete: false };
              const isCompleted = weekStats.isComplete;
              const isUnlocked = week === 1 || weeklyStats[week - 1]?.isComplete || weekProgress[week]?.isUnlocked;
              const isCurrent = isUnlocked && !isCompleted && week === currentWeek;
              
              return (
                <div
                  key={week}
                  className={`weekly-card ${isCompleted ? 'is-complete' : isCurrent ? 'is-current' : 'is-upcoming'}`}
                >
                  <h4>Week {week}</h4>
                  <p className="weekly-card__status">
                    {isCompleted ? '✅ Completed' : isUnlocked ? '🔄 In Progress' : '⏳ Locked'}
                  </p>
                  {(isCompleted || isUnlocked) && (
                    <p className="weekly-card__count">
                      {weekStats.workouts}/7 workouts • {weekStats.meals}/28 meals
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Analysis & Feedback */}
        <div className="card progress-feedback card--spaced">
          <h3 className="section-title">🧠 Daily Mood & Feedback</h3>
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
            <div className="feedback-result">
              <p>Sentiment: <strong>{feedbackResult.sentiment}</strong></p>
              <p>Suggested Intensity: <strong>{feedbackResult.intensity}</strong></p>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="card card--spaced">
          <h3 className="section-title">🏆 Achievements</h3>
          <div className="achievement-grid">
            <div className="achievement-card">
              <h4>🎯 First Week Complete</h4>
              <p className="achievement-text">
                Complete your first week of training
              </p>
              <p className="achievement-subtext">
                Not yet achieved
              </p>
            </div>
            
            <div className="achievement-card">
              <h4>💪 Strength Builder</h4>
              <p className="achievement-text">
                Complete 10 strength training sessions
              </p>
              <p className="achievement-subtext">
                0/10 sessions
              </p>
            </div>
            
            <div className="achievement-card">
              <h4>🔥 Calorie Crusher</h4>
              <p className="achievement-text">
                Burn 1000 calories through workouts
              </p>
              <p className="achievement-subtext">
                {caloriesSeries.values.reduce((sum, value) => sum + value, 0)}/1000 calories
              </p>
            </div>
            
            <div className="achievement-card achievement-card--muted">
              <h4>🏃 Consistency Champion</h4>
              <p className="achievement-text">
                Complete 7 consecutive days of workouts
              </p>
              <p className="achievement-subtext">
                Not yet achieved
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card">
          <h3 className="section-title">🎯 Next Steps</h3>
          <div className="next-steps">
            <Link 
              to={`/plan/workout/${currentWeek}/1`}
              className="btn btn-primary btn-link next-step"
            >
              Start Today's Workout
            </Link>
            <Link 
              to={`/plan/diet/${currentWeek}`}
              className="btn btn-secondary btn-link next-step"
            >
              View Diet Plan
            </Link>
            <Link 
              to="/plan/overview"
              className="btn btn-muted btn-link next-step"
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
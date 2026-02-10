import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/useUser';
import { Activity, CheckCircle2, Flame, Timer, XCircle } from 'lucide-react';

const WorkoutDay = () => {
  const { week, day } = useParams();
  const { fitnessData, user } = useUser();
  const [logStatus, setLogStatus] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [exerciseStatus, setExerciseStatus] = useState({});
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [logData, setLogData] = useState({
    caloriesBurned: '',
    workoutMinutes: '',
    performanceScore: ''
  });

  if (!fitnessData) {
    return (
      <div className="page-loader">
        <p className="page-loader__text">Loading...</p>
      </div>
    );
  }

  const workoutData = fitnessData.workoutPlan[`week${week}`][`day${day}`];
  
  if (!workoutData) {
    return <div>Workout not found</div>;
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayName = dayNames[parseInt(day) - 1];
  const storagePrefix = useMemo(() => {
    const token = localStorage.getItem('token') || 'guest';
    const rawKey = user?.email || user?.user_id || user?.name || token;
    return `fitplan_${String(rawKey).replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }, [user]);
  const workoutStorageKey = useMemo(
    () => `${storagePrefix}_workout_${week}_${day}`,
    [storagePrefix, week, day]
  );

  const exerciseNames = useMemo(() => {
    if (!workoutData || workoutData.type === 'rest') return [];
    const warmup = workoutData.template?.warmup || [];
    const main = workoutData.template?.main || [];
    const cooldown = workoutData.template?.cooldown || [];
    return [...warmup, ...main, ...cooldown]
      .map((item) => item.exercise)
      .filter(Boolean);
  }, [workoutData]);

  useEffect(() => {
    const stored = localStorage.getItem(workoutStorageKey);
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      setIsCompleted(!!data.isCompleted);
      setExerciseStatus(data.exerciseStatus || {});
    } catch (err) {
      console.error('Workout status load failed:', err);
    }
  }, [workoutStorageKey]);

  useEffect(() => {
    const payload = {
      isCompleted,
      exerciseStatus
    };
    localStorage.setItem(workoutStorageKey, JSON.stringify(payload));
  }, [workoutStorageKey, isCompleted, exerciseStatus]);

  useEffect(() => {
    if (!exerciseNames.length) return;

    let isActive = true;
    const uniqueNames = Array.from(new Set(exerciseNames));
    const missingNames = uniqueNames.filter((name) => exerciseDetails[name] === undefined);

    if (!missingNames.length) return;

    const loadExerciseDetails = async () => {
      const results = await Promise.all(missingNames.map(async (name) => {
        try {
          const response = await fetch(`http://localhost:5000/api/exercises/lookup?name=${encodeURIComponent(name)}`);
          if (!response.ok) return { name, detail: null };
          const data = await response.json();
          return { name, detail: data };
        } catch (err) {
          console.error('Failed to load exercise details:', err);
          return { name, detail: null };
        }
      }));

      if (!isActive) return;

      const nextDetails = results.reduce((acc, item) => {
        acc[item.name] = item.detail;
        return acc;
      }, {});

      setExerciseDetails((prev) => ({
        ...prev,
        ...nextDetails
      }));
    };

    loadExerciseDetails();

    return () => {
      isActive = false;
    };
  }, [exerciseNames, exerciseDetails]);

  const renderExerciseDetails = (detail) => {
    if (detail === undefined) {
      return (
        <p className="exercise-details__meta">
          Loading details...
        </p>
      );
    }

    if (!detail) {
      return (
        <p className="exercise-details__meta">
          No dataset details available.
        </p>
      );
    }

    return (
      <div className="exercise-details">
        {detail.imageUrls && detail.imageUrls[0] && (
          <img
            src={detail.imageUrls[0]}
            alt={`${detail.name} demonstration`}
            className="exercise-details__image"
          />
        )}
        <div className="exercise-details__meta">
          <strong className="exercise-details__label">Equipment:</strong> {detail.equipment || 'N/A'}
        </div>
        <div className="exercise-details__meta">
          <strong className="exercise-details__label">Level:</strong> {detail.level || 'N/A'}
        </div>
        <div className="exercise-details__meta">
          <strong className="exercise-details__label">Primary:</strong> {detail.primaryMuscles?.join(', ') || 'N/A'}
        </div>
        {detail.instructions && detail.instructions.length > 0 && (
          <div className="exercise-details__meta">
            <strong className="exercise-details__label">How to:</strong>
            <ol className="exercise-details__list">
              {detail.instructions.map((step, idx) => (
                <li key={idx} className="exercise-details__list-item">{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  const estimatedCalories = useMemo(() => {
    const weight = Number(user?.weight || 0);
    const minutes = Number(logData.workoutMinutes || 60);
    const intensity = Number(workoutData.intensity || 1);
    if (!weight || !minutes) return 0;
    return Math.round(weight * minutes * 0.08 * intensity);
  }, [user, logData.workoutMinutes, workoutData.intensity]);

  const handleLogWorkout = async (completedValue) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const calories = logData.caloriesBurned ? Number(logData.caloriesBurned) : estimatedCalories;
      const minutes = logData.workoutMinutes ? Number(logData.workoutMinutes) : 60;
      const response = await fetch('http://localhost:5000/api/user/log-activity', {
        method: 'POST',
        headers: {
          token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          week: parseInt(week),
          day: parseInt(day),
          caloriesBurned: calories,
          workoutMinutes: minutes,
          performanceScore: logData.performanceScore ? Number(logData.performanceScore) : null,
          isCompleted: completedValue
        })
      });

      if (response.ok) {
        setIsCompleted(completedValue);
        setLogStatus(completedValue ? 'Workout completed and saved.' : 'Workout marked as not completed.');
      } else {
        setLogStatus('Unable to log workout.');
      }
    } catch (err) {
      console.error('Log workout failed:', err);
      setLogStatus('Unable to log workout.');
    }
  };

  return (
    <div className="workout-shell workout-page">
      <header className="workout-hero workout-hero--dark">
        <div className="container workout-hero__content">
          <div className="workout-hero__meta">
            <div>
              <p className="page-hero__kicker">
                Workout Session
              </p>
              <h1 className="page-hero__headline">
                Week {week} - {dayName}
              </h1>
              <p className="workout-hero__subtitle">
                {workoutData.title} • {workoutData.phase}
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-link">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container section-spacing">
        {workoutData.type === 'rest' ? (
          <div className="card rest-day-card">
            <h2 className="rest-day-title">
              🛌 Rest Day
            </h2>
            <p className="rest-day-text">
              Recovery is just as important as training. Take time to rest and recharge.
            </p>
            <div className="rest-day-grid">
              <div className="rest-day-tip">
                <h4>💧 Stay Hydrated</h4>
                <p className="rest-day-tip__text">
                  Drink plenty of water throughout the day
                </p>
              </div>
              <div className="rest-day-tip rest-day-tip--warm">
                <h4>🧘 Light Stretching</h4>
                <p className="rest-day-tip__text">
                  Gentle stretches to maintain flexibility
                </p>
              </div>
              <div className="rest-day-tip">
                <h4>😴 Quality Sleep</h4>
                <p className="rest-day-tip__text">
                  Aim for 7-9 hours of restful sleep
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="card workout-snapshot workout-snapshot-card card--spaced">
              <h3 className="section-title">Session Snapshot</h3>
              <div className="workout-metrics-grid">
                {[
                  { label: 'Type', value: workoutData.type.charAt(0).toUpperCase() + workoutData.type.slice(1), tone: 'green', icon: Activity },
                  { label: 'Duration', value: '60 min', tone: 'orange', icon: Timer },
                  { label: 'Intensity', value: `${Math.round(workoutData.intensity * 100)}%`, tone: 'neutral', icon: Flame },
                  { label: 'Phase', value: workoutData.phase, tone: 'orange', icon: CheckCircle2 }
                ].map(item => (
                  <div key={item.label} className={`workout-metric workout-metric--${item.tone}`}>
                    <p className="workout-metric__label">
                      {item.label}
                    </p>
                    <div className="workout-metric__icon">
                      <item.icon size={18} />
                    </div>
                    <p className="workout-metric__value">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card workout-section workout-section--warmup card--spaced">
              <div className="workout-section__header">
                <h3 className="workout-section__title text-accent--orange">🔥 Warm-up</h3>
                <span className="workout-section__time">10 minutes</span>
              </div>
              <div className="workout-exercises-grid">
                {workoutData.template.warmup.map((exercise, index) => (
                  <div key={index} className="workout-exercise workout-exercise--warmup">
                    <h4>{exercise.exercise}</h4>
                    <p className="exercise-duration">{exercise.duration}</p>
                    {renderExerciseDetails(exerciseDetails[exercise.exercise])}
                  </div>
                ))}
              </div>
            </div>

            <div className="card workout-section workout-section--main card--spaced">
              <div className="workout-section__header">
                <h3 className="workout-section__title text-accent--green">💪 Main Workout</h3>
                <span className="workout-section__time">40 minutes</span>
              </div>
              <div className="workout-exercises-grid workout-exercises-grid--main">
                {workoutData.template.main.map((exercise, index) => (
                  <div
                    key={index}
                    className={`workout-exercise workout-exercise--main ${exerciseStatus[`${week}-${day}-main-${index}`] ? 'is-done' : ''}`}
                  >
                    <div className="workout-exercise__header">
                      <h4 className="workout-exercise__title">{exercise.exercise}</h4>
                      <div className="workout-exercise__actions">
                        <button
                          type="button"
                          className={`btn workout-pill workout-status-btn ${exerciseStatus[`${week}-${day}-main-${index}`] ? 'is-muted' : 'is-inactive'}`}
                          onClick={() => setExerciseStatus(prev => ({
                            ...prev,
                            [`${week}-${day}-main-${index}`]: false
                          }))}
                        >
                          Not Done
                        </button>
                        <button
                          type="button"
                          className={`btn workout-pill workout-status-btn ${exerciseStatus[`${week}-${day}-main-${index}`] ? 'is-active' : 'is-muted'}`}
                          onClick={() => setExerciseStatus(prev => ({
                            ...prev,
                            [`${week}-${day}-main-${index}`]: true
                          }))}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                    <div className="workout-exercise__meta">
                      {exercise.sets && (
                        <p><strong>Sets:</strong> {exercise.sets}</p>
                      )}
                      {exercise.reps && (
                        <p><strong>Reps:</strong> {exercise.reps}</p>
                      )}
                      {exercise.duration && (
                        <p><strong>Duration:</strong> {exercise.duration}</p>
                      )}
                      {exercise.work && (
                        <p><strong>Work:</strong> {exercise.work} | <strong>Rest:</strong> {exercise.rest}</p>
                      )}
                      {exercise.rounds && (
                        <p><strong>Rounds:</strong> {exercise.rounds}</p>
                      )}
                      {exercise.rest && !exercise.work && (
                        <p><strong>Rest:</strong> {exercise.rest}</p>
                      )}
                      {exercise.intensity && (
                        <p><strong>Intensity:</strong> {exercise.intensity}</p>
                      )}
                    </div>
                    {renderExerciseDetails(exerciseDetails[exercise.exercise])}
                  </div>
                ))}
              </div>
            </div>

            <div className="card workout-section workout-section--cooldown card--spaced">
              <div className="workout-section__header">
                <h3 className="workout-section__title">🧘 Cool-down</h3>
                <span className="workout-section__time">10 minutes</span>
              </div>
              <div className="workout-exercises-grid">
                {workoutData.template.cooldown.map((exercise, index) => (
                  <div key={index} className="workout-exercise workout-exercise--cooldown">
                    <h4>{exercise.exercise}</h4>
                    <p className="exercise-duration">{exercise.duration}</p>
                    {renderExerciseDetails(exerciseDetails[exercise.exercise])}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="card workout-nav">
          <h3 className="section-title">Week {week} Schedule</h3>
          <div className="workout-nav__grid">
            {Array.from({ length: 7 }, (_, i) => i + 1).map(dayNum => {
              const dayWorkout = fitnessData.workoutPlan[`week${week}`][`day${dayNum}`];
              const isCurrentDay = dayNum === parseInt(day);
              
              return (
                <Link
                  key={dayNum}
                  to={`/plan/workout/${week}/${dayNum}`}
                  className={`workout-nav__day ${isCurrentDay ? 'is-active' : ''}`}
                >
                  <div className="workout-nav__label">
                    {dayNames[dayNum - 1].slice(0, 3)}
                  </div>
                  <div className="workout-nav__icon">
                    {dayWorkout.type === 'rest' ? '🛌' : '💪'}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card workout-log card--spaced">
          <h3 className="section-title">📝 Log Workout Performance</h3>
          <div className="workout-log__grid">
            <div className="form-group">
              <label className="form-label">Calories Burned</label>
              <input
                type="number"
                className="form-input"
                value={logData.caloriesBurned}
                onChange={(e) => setLogData(prev => ({ ...prev, caloriesBurned: e.target.value }))}
              />
              <p className="workout-log__hint">
                Estimated: {estimatedCalories} cal
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Workout Minutes</label>
              <input
                type="number"
                className="form-input"
                value={logData.workoutMinutes}
                onChange={(e) => setLogData(prev => ({ ...prev, workoutMinutes: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Performance Score (1-10)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="10"
                value={logData.performanceScore}
                onChange={(e) => setLogData(prev => ({ ...prev, performanceScore: e.target.value }))}
              />
            </div>
          </div>
          <div className="workout-log__actions">
            <button
              className={`btn workout-log__btn ${isCompleted ? 'is-muted' : 'is-inactive'}`}
              onClick={() => handleLogWorkout(false)}
            >
              <XCircle size={16} className="workout-log__icon" /> Not Done
            </button>
            <button className="btn btn-primary workout-log__btn" onClick={() => handleLogWorkout(true)}>
              <CheckCircle2 size={16} className="workout-log__icon" /> Done
            </button>
          </div>
          {logStatus && (
            <p className="workout-log__status">{logStatus}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDay;
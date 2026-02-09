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
    return <div>Loading...</div>;
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
        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '0.5rem' }}>
          Loading details...
        </p>
      );
    }

    if (!detail) {
      return (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '0.5rem' }}>
          No dataset details available.
        </p>
      );
    }

    return (
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.6rem' }}>
        {detail.imageUrls && detail.imageUrls[0] && (
          <img
            src={detail.imageUrls[0]}
            alt={`${detail.name} demonstration`}
            style={{
              width: '100%',
              borderRadius: '0.6rem',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              objectFit: 'cover'
            }}
          />
        )}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
          <strong style={{ color: 'var(--text-dark)' }}>Equipment:</strong> {detail.equipment || 'N/A'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
          <strong style={{ color: 'var(--text-dark)' }}>Level:</strong> {detail.level || 'N/A'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
          <strong style={{ color: 'var(--text-dark)' }}>Primary:</strong> {detail.primaryMuscles?.join(', ') || 'N/A'}
        </div>
        {detail.instructions && detail.instructions.length > 0 && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
            <strong style={{ color: 'var(--text-dark)' }}>How to:</strong>
            <ol style={{ margin: '0.35rem 0 0 1.1rem', padding: 0 }}>
              {detail.instructions.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{step}</li>
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
    <div className="workout-shell" style={{ minHeight: '100vh' }}>
      <header className="workout-hero" style={{ 
        background: 'linear-gradient(135deg, #0f172a, #1f2937 45%, #16a34a 100%)',
        color: 'white',
        padding: '2.5rem 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', opacity: 0.7 }}>
                Workout Session
              </p>
              <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
                Week {week} - {dayName}
              </h1>
              <p style={{ opacity: 0.9 }}>
                {workoutData.title} • {workoutData.phase}
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
        {workoutData.type === 'rest' ? (
          <div className="card rest-day-card">
            <h2 style={{ color: 'var(--fitness-green)', marginBottom: '1rem' }}>
              🛌 Rest Day
            </h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: 'var(--text-gray)' }}>
              Recovery is just as important as training. Take time to rest and recharge.
            </p>
            <div className="rest-day-grid">
              <div className="rest-day-tip">
                <h4>💧 Stay Hydrated</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                  Drink plenty of water throughout the day
                </p>
              </div>
              <div className="rest-day-tip rest-day-tip--warm">
                <h4>🧘 Light Stretching</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                  Gentle stretches to maintain flexibility
                </p>
              </div>
              <div className="rest-day-tip">
                <h4>😴 Quality Sleep</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                  Aim for 7-9 hours of restful sleep
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="card workout-snapshot workout-snapshot-card" style={{
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Session Snapshot</h3>
              <div className="workout-metrics-grid">
                {[
                  { label: 'Type', value: workoutData.type.charAt(0).toUpperCase() + workoutData.type.slice(1), color: '#16a34a', icon: Activity },
                  { label: 'Duration', value: '60 min', color: '#f97316', icon: Timer },
                  { label: 'Intensity', value: `${Math.round(workoutData.intensity * 100)}%`, color: '#0f172a', icon: Flame },
                  { label: 'Phase', value: workoutData.phase, color: '#f97316', icon: CheckCircle2 }
                ].map(item => (
                  <div key={item.label} className="workout-metric">
                    <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-gray)' }}>
                      {item.label}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <item.icon size={18} color={item.color} />
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: '700', color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card workout-section workout-section--warmup" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--energy-orange)' }}>🔥 Warm-up</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>10 minutes</span>
              </div>
              <div className="workout-exercises-grid">
                {workoutData.template.warmup.map((exercise, index) => (
                  <div key={index} className="workout-exercise workout-exercise--warmup">
                    <h4>{exercise.exercise}</h4>
                    <p style={{ color: 'var(--text-gray)' }}>{exercise.duration}</p>
                    {renderExerciseDetails(exerciseDetails[exercise.exercise])}
                  </div>
                ))}
              </div>
            </div>

            <div className="card workout-section workout-section--main" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--fitness-green)' }}>💪 Main Workout</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>40 minutes</span>
              </div>
              <div className="workout-exercises-grid workout-exercises-grid--main">
                {workoutData.template.main.map((exercise, index) => (
                  <div
                    key={index}
                    className={`workout-exercise workout-exercise--main ${exerciseStatus[`${week}-${day}-main-${index}`] ? 'is-done' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.05rem' }}>{exercise.exercise}</h4>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn workout-pill"
                          onClick={() => setExerciseStatus(prev => ({
                            ...prev,
                            [`${week}-${day}-main-${index}`]: false
                          }))}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: exerciseStatus[`${week}-${day}-main-${index}`]
                              ? '#e2e8f0'
                              : 'linear-gradient(135deg, #0f172a, #1f2937)',
                            color: exerciseStatus[`${week}-${day}-main-${index}`] ? '#0f172a' : 'white'
                          }}
                        >
                          Not Done
                        </button>
                        <button
                          type="button"
                          className="btn workout-pill"
                          onClick={() => setExerciseStatus(prev => ({
                            ...prev,
                            [`${week}-${day}-main-${index}`]: true
                          }))}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: exerciseStatus[`${week}-${day}-main-${index}`]
                              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                              : '#e2e8f0',
                            color: exerciseStatus[`${week}-${day}-main-${index}`] ? 'white' : '#0f172a'
                          }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
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

            <div className="card workout-section workout-section--cooldown" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#0f172a' }}>🧘 Cool-down</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>10 minutes</span>
              </div>
              <div className="workout-exercises-grid">
                {workoutData.template.cooldown.map((exercise, index) => (
                  <div key={index} className="workout-exercise workout-exercise--cooldown">
                    <h4>{exercise.exercise}</h4>
                    <p style={{ color: 'var(--text-gray)' }}>{exercise.duration}</p>
                    {renderExerciseDetails(exerciseDetails[exercise.exercise])}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="card workout-nav">
          <h3 style={{ marginBottom: '1rem' }}>Week {week} Schedule</h3>
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
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    {dayNames[dayNum - 1].slice(0, 3)}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {dayWorkout.type === 'rest' ? '🛌' : '💪'}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card workout-log" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📝 Log Workout Performance</h3>
          <div className="workout-log__grid">
            <div className="form-group">
              <label className="form-label">Calories Burned</label>
              <input
                type="number"
                className="form-input"
                value={logData.caloriesBurned}
                onChange={(e) => setLogData(prev => ({ ...prev, caloriesBurned: e.target.value }))}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '0.35rem' }}>
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
              className="btn"
              onClick={() => handleLogWorkout(false)}
              style={{
                background: isCompleted ? '#e2e8f0' : 'linear-gradient(135deg, #0f172a, #1f2937)',
                color: isCompleted ? '#0f172a' : 'white'
              }}
            >
              <XCircle size={16} style={{ marginRight: '0.35rem' }} /> Not Done
            </button>
            <button className="btn btn-primary" onClick={() => handleLogWorkout(true)}>
              <CheckCircle2 size={16} style={{ marginRight: '0.35rem' }} /> Done
            </button>
          </div>
          {logStatus && (
            <p style={{ marginTop: '0.75rem', color: 'var(--text-gray)' }}>{logStatus}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDay;
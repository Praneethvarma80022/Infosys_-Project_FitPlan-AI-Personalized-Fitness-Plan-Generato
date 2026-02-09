import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/useUser';

const DietWeek = () => {
  const { week } = useParams();
  const { fitnessData, user } = useUser();

  if (!fitnessData) {
    return <div>Loading...</div>;
  }

  const weekDiet = fitnessData.dietPlan[`week${week}`];
  
  if (!weekDiet) {
    return <div>Diet plan not found</div>;
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [activeDay, setActiveDay] = useState(1);
  const [eatenMeals, setEatenMeals] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);

  const storagePrefix = useMemo(() => {
    const token = localStorage.getItem('token') || 'guest';
    const rawKey = user?.email || user?.user_id || user?.name || token;
    return `fitplan_${String(rawKey).replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }, [user]);
  const dietStorageKey = useMemo(
    () => `${storagePrefix}_diet_week_${week}`,
    [storagePrefix, week]
  );

  const dayKey = `day${activeDay}`;
  const activeDayData = weekDiet[dayKey];

  useEffect(() => {
    const stored = localStorage.getItem(dietStorageKey);
    if (!stored) return;
    try {
      setEatenMeals(JSON.parse(stored));
    } catch (err) {
      console.error('Diet status load failed:', err);
    }
  }, [dietStorageKey]);

  useEffect(() => {
    localStorage.setItem(dietStorageKey, JSON.stringify(eatenMeals));
  }, [dietStorageKey, eatenMeals]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const loadLogs = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/user/diet/logs?week=${week}`, {
          method: 'GET',
          headers: {
            token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) return;
        const data = await response.json();
        const logs = data.logs || {};
        setEatenMeals((prev) => {
          const next = { ...prev };
          Object.keys(logs).forEach((loggedDay) => {
            next[loggedDay] = {
              ...(prev[loggedDay] || {}),
              ...logs[loggedDay]
            };
          });
          return next;
        });
      } catch (err) {
        console.error('Diet logs load failed:', err);
      }
    };

    loadLogs();
  }, [week]);

  const saveMealStatus = async (mealKey, isEaten) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const meal = activeDayData.meals[mealKey];
      const response = await fetch('http://localhost:5000/api/user/diet/log', {
        method: 'POST',
        headers: {
          token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          week: Number(week),
          day: activeDay,
          mealKey,
          eaten: isEaten,
          calories: meal.calories,
          protein: meal.protein
        })
      });

      if (response.ok) {
        setSaveStatus('Saved');
      } else {
        setSaveStatus('Save failed');
      }
    } catch (err) {
      console.error('Diet log failed:', err);
      setSaveStatus('Save failed');
    }
  };

  const setMealStatus = (mealKey, isEaten) => {
    setEatenMeals(prev => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || {}),
        [mealKey]: isEaten
      }
    }));
    saveMealStatus(mealKey, isEaten);
  };

  const dayTotals = useMemo(() => {
    if (!activeDayData) return { calories: 0, protein: 0 };
    const mealKeys = ['breakfast', 'lunch', 'snack', 'dinner'];
    return mealKeys.reduce((acc, key) => {
      if (eatenMeals[dayKey]?.[key]) {
        acc.calories += activeDayData.meals[key].calories || 0;
        acc.protein += activeDayData.meals[key].protein || 0;
      }
      return acc;
    }, { calories: 0, protein: 0 });
  }, [activeDayData, eatenMeals, dayKey]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #0f172a, #111827 45%, #f97316 100%)',
        color: 'white',
        padding: '2.5rem 0'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', opacity: 0.7 }}>
                Nutrition Plan
              </p>
              <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
                Week {week} Diet Plan
              </h1>
              <p style={{ opacity: 0.9 }}>
                Your personalized meal plan for optimal results
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
        <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.08), rgba(249, 115, 22, 0.08))' }}>
          <h3 style={{ marginBottom: '1rem' }}>Week {week} Overview</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem'
          }}>
            {[
              { label: 'Target Calories', value: `${fitnessData.targetCalories}/day`, color: '#f97316' },
              { label: 'Meals per Day', value: '4 meals', color: '#22c55e' },
              { label: 'Avg Protein', value: '~25g per meal', color: '#0f172a' },
              { label: 'Variety', value: 'Rotating menu', color: '#22c55e' }
            ].map(item => (
              <div key={item.label} style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-gray)' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Select Day</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.75rem' }}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className="btn"
                style={{
                  padding: '0.6rem 0.5rem',
                  background: activeDay === day ? 'linear-gradient(135deg, #f97316, #fb923c)' : '#f8fafc',
                  color: activeDay === day ? 'white' : '#0f172a',
                  border: activeDay === day ? 'none' : '1px solid #e2e8f0'
                }}
              >
                {dayNames[day - 1].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ color: '#0f172a' }}>{dayNames[activeDay - 1]}</h3>
              <p style={{ color: 'var(--text-gray)' }}>Tap “Eaten” to track your intake.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600' }}>{activeDayData.totalCalories} cal</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Target</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { key: 'breakfast', label: '🌅 Breakfast', tone: '#f0fdf4', border: '#bbf7d0' },
              { key: 'lunch', label: '☀️ Lunch', tone: '#fff7ed', border: '#fed7aa' },
              { key: 'snack', label: '🍎 Evening Snack', tone: '#f0fdf4', border: '#bbf7d0' },
              { key: 'dinner', label: '🌙 Dinner', tone: '#fff7ed', border: '#fed7aa' }
            ].map(section => (
              <div key={section.key} style={{ padding: '0.75rem', borderRadius: '0.75rem', border: `1px solid ${section.border}`, backgroundColor: section.tone }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1rem' }}>
                  <h4 style={{ color: section.key === 'lunch' || section.key === 'dinner' ? 'var(--energy-orange)' : 'var(--fitness-green)' }}>
                    {section.label}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setMealStatus(section.key, false)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        background: eatenMeals[dayKey]?.[section.key] ? '#e2e8f0' : 'linear-gradient(135deg, #0f172a, #1f2937)',
                        color: eatenMeals[dayKey]?.[section.key] ? '#0f172a' : 'white'
                      }}
                    >
                      Not Eaten
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setMealStatus(section.key, true)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        background: eatenMeals[dayKey]?.[section.key]
                          ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                          : '#e2e8f0',
                        color: eatenMeals[dayKey]?.[section.key] ? 'white' : '#0f172a'
                      }}
                    >
                      Eaten
                    </button>
                  </div>
                </div>
                <p style={{ fontWeight: '600' }}>{activeDayData.meals[section.key].name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'white', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                    {activeDayData.meals[section.key].calories} cal
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'white', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                    {activeDayData.meals[section.key].protein}g protein
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'white', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                    {activeDayData.meals[section.key].carbs}g carbs
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'white', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                    {activeDayData.meals[section.key].fat}g fat
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #0f172a, #1f2937)',
            color: 'white',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cbd5f5' }}>
                Calories Gained
              </p>
              <p style={{ fontSize: '1.4rem', fontWeight: '700' }}>{dayTotals.calories} cal</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cbd5f5' }}>
                Protein Gained
              </p>
              <p style={{ fontSize: '1.4rem', fontWeight: '700' }}>{dayTotals.protein} g</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cbd5f5' }}>
                Remaining Calories
              </p>
              <p style={{ fontSize: '1.4rem', fontWeight: '700' }}>
                {Math.max(0, activeDayData.targetCalories - dayTotals.calories)} cal
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cbd5f5' }}>
                Status
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{saveStatus || 'Ready'}</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>💡 Nutrition Tips for Week {week}</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '0.75rem', color: 'white' }}>
              <h4>💧 Hydration</h4>
              <p style={{ fontSize: '0.875rem', color: '#cbd5f5' }}>
                Drink at least 8-10 glasses of water daily
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.75rem' }}>
              <h4>⏰ Meal Timing</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Eat every 3-4 hours to maintain energy levels
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem' }}>
              <h4>🥗 Portion Control</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Use smaller plates and eat slowly
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.75rem' }}>
              <h4>🍽️ Meal Prep</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>
                Prepare meals in advance for consistency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietWeek;
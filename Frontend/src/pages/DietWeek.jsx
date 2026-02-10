import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/useUser';
import dietsData from '../data/diets.json';

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

  const quantityByName = useMemo(() => {
    const lookup = {};
    const templates = dietsData?.mealTemplates || {};
    Object.values(templates).forEach((cuisine) => {
      if (!cuisine) return;
      ['breakfast', 'lunch', 'snack', 'dinner'].forEach((slot) => {
        (cuisine[slot] || []).forEach((meal) => {
          if (meal?.name && meal?.quantity) {
            lookup[meal.name] = meal.quantity;
          }
        });
      });
    });
    return lookup;
  }, []);

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
    <div className="page page--light">
      <header className="page-hero page-hero--dark">
        <div className="container page-hero__content">
          <div className="page-hero__title">
            <div>
              <p className="page-hero__kicker">
                Nutrition Plan
              </p>
              <h1 className="page-hero__headline">
                Week {week} Diet Plan
              </h1>
              <p className="page-hero__lede">
                Your personalized meal plan for optimal results
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-link">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container section-spacing">
        <div className="card diet-overview">
          <h3 className="section-title">Week {week} Overview</h3>
          <div className="diet-overview-grid">
            {[
              { label: 'Target Calories', value: `${fitnessData.targetCalories}/day`, tone: 'orange' },
              { label: 'Meals per Day', value: '4 meals', tone: 'green' },
              { label: 'Avg Protein', value: '~25g per meal', tone: 'neutral' },
              { label: 'Variety', value: 'Rotating menu', tone: 'green' }
            ].map(item => (
              <div key={item.label} className="diet-overview-item">
                <p className="diet-overview-label">
                  {item.label}
                </p>
                <p className={`diet-overview-value diet-overview-value--${item.tone}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card card--spaced">
          <h3 className="section-title">Select Day</h3>
          <div className="day-selector">
            {Array.from({ length: 7 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`day-pill${activeDay === day ? ' is-active' : ''}`}
              >
                {dayNames[day - 1].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="card diet-day-card">
          <div className="diet-day-header">
            <div>
              <h3>{dayNames[activeDay - 1]}</h3>
              <p className="diet-day-meta">Tap “Eaten” to track your intake.</p>
            </div>
            <div className="diet-target">
              <p className="diet-target__value">{activeDayData.totalCalories} cal</p>
              <p className="diet-target__label">Target</p>
            </div>
          </div>

          <div className="diet-meals">
            {[
              { key: 'breakfast', label: '🌅 Breakfast', tone: '#f0fdf4', border: '#bbf7d0' },
              { key: 'lunch', label: '☀️ Lunch', tone: '#fff7ed', border: '#fed7aa' },
              { key: 'snack', label: '🍎 Evening Snack', tone: '#f0fdf4', border: '#bbf7d0' },
              { key: 'dinner', label: '🌙 Dinner', tone: '#fff7ed', border: '#fed7aa' }
            ].map(section => {
              const isEaten = eatenMeals[dayKey]?.[section.key];
              const meal = activeDayData.meals[section.key];
              const quantityText = meal?.quantity || quantityByName[meal?.name] || null;
              const mealToneClass = section.key === 'lunch' || section.key === 'dinner'
                ? 'meal-card--orange'
                : 'meal-card--green';
              return (
                <div key={section.key} className={`meal-card ${mealToneClass}`}>
                  <div className="meal-header">
                    <h4 className={section.key === 'lunch' || section.key === 'dinner' ? 'text-accent--orange' : 'text-accent--green'}>
                      {section.label}
                    </h4>
                    <div className="meal-actions">
                      <button
                        type="button"
                        className={`meal-status-btn ${isEaten ? 'is-muted' : 'is-inactive'}`}
                        onClick={() => setMealStatus(section.key, false)}
                      >
                        Not Eaten
                      </button>
                      <button
                        type="button"
                        className={`meal-status-btn ${isEaten ? 'is-active' : 'is-muted'}`}
                        onClick={() => setMealStatus(section.key, true)}
                      >
                        Eaten
                      </button>
                    </div>
                  </div>
                  <p className="meal-title">{meal.name}</p>
                  <div className="meal-chip-row">
                    {quantityText ? (
                      <span className="meal-chip">
                        {quantityText}
                      </span>
                    ) : null}
                    <span className="meal-chip">
                      {meal.calories} cal
                    </span>
                    <span className="meal-chip">
                      {meal.protein}g protein{meal.quantityGrams ? ` | ${meal.quantityGrams}g qty` : ''}
                    </span>
                    <span className="meal-chip">
                      {meal.carbs}g carbs
                    </span>
                    <span className="meal-chip">
                      {meal.fat}g fat
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="diet-summary">
            <div>
              <p className="diet-summary-label">
                Calories Gained
              </p>
              <p className="diet-summary-value">{dayTotals.calories} cal</p>
            </div>
            <div>
              <p className="diet-summary-label">
                Protein Gained
              </p>
              <p className="diet-summary-value">{dayTotals.protein} g</p>
            </div>
            <div>
              <p className="diet-summary-label">
                Remaining Calories
              </p>
              <p className="diet-summary-value">
                {Math.max(0, activeDayData.targetCalories - dayTotals.calories)} cal
              </p>
            </div>
            <div className="diet-summary-status">
              <p className="diet-summary-label">
                Status
              </p>
              <p className="diet-summary-status__value">{saveStatus || 'Ready'}</p>
            </div>
          </div>
        </div>

        <div className="card card--spaced">
          <h3 className="section-title">💡 Nutrition Tips for Week {week}</h3>
          <div className="diet-tips-grid">
            <div className="diet-tip-card">
              <h4>💧 Hydration</h4>
              <p>
                Drink at least 8-10 glasses of water daily
              </p>
            </div>
            <div className="diet-tip-card">
              <h4>⏰ Meal Timing</h4>
              <p>
                Eat every 3-4 hours to maintain energy levels
              </p>
            </div>
            <div className="diet-tip-card">
              <h4>🥗 Portion Control</h4>
              <p>
                Use smaller plates and eat slowly
              </p>
            </div>
            <div className="diet-tip-card">
              <h4>🍽️ Meal Prep</h4>
              <p>
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
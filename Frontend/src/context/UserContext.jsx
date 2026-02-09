import React, { useState, useEffect } from 'react';
import UserContext from './userContextBase';
import rulesData from '../data/rules.json';
import workoutsData from '../data/workouts.json';
import dietsData from '../data/diets.json';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [fitnessData, setFitnessData] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressSummary, setProgressSummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [predictions, setPredictions] = useState(null);

  // --- 1. HELPER FUNCTIONS (Defined first so they can be used below) ---

  const calculateBMR = (userData) => {
    const { age, sex, height, weight } = userData;
    let bmr;
    if (sex === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    return Math.round(bmr * rulesData.calorieRules.activityMultiplier);
  };

  const calculateBMI = (userData) => {
    const { height, weight } = userData;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { category: 'Underweight', color: '#3b82f6', risk: 'Low' };
    if (bmiValue < 25) return { category: 'Normal', color: '#22c55e', risk: 'Low' };
    if (bmiValue < 30) return { category: 'Overweight', color: '#f59e0b', risk: 'Moderate' };
    if (bmiValue < 35) return { category: 'Obese', color: '#ef4444', risk: 'High' };
    return { category: 'Extremely Obese', color: '#991b1b', risk: 'Very High' };
  };

  const addLevelExtras = (template, fitnessLevel, week) => {
    if (week === 1) return template;
    const extras = {
      beginner: [
        { exercise: 'Glute Bridges', sets: 2, reps: '12-15', rest: '45s' }
      ],
      intermediate: [
        { exercise: 'Dumbbell Rows', sets: 3, reps: '10-12', rest: '60s' },
        { exercise: 'Side Plank', sets: 3, duration: '30s each side', rest: '45s' }
      ],
      advanced: [
        { exercise: 'Bulgarian Split Squats', sets: 3, reps: '8-10 each leg', rest: '60s' },
        { exercise: 'Burpee Finisher', work: '30s', rest: '30s', rounds: 4 }
      ]
    };

    if (!template.main) return template;
    return {
      ...template,
      main: [...template.main, ...(extras[fitnessLevel] || [])]
    };
  };

  const adjustScheduleForLevel = (pattern, fitnessLevel) => {
    const updated = [...pattern];
    if (fitnessLevel === 'beginner') {
      const restIndex = updated.indexOf('rest');
      if (restIndex >= 0) updated[restIndex] = 'flexibility';
    }
    if (fitnessLevel === 'intermediate') {
      const restIndex = updated.lastIndexOf('rest');
      if (restIndex >= 0) updated[restIndex] = 'cardio';
    }
    return updated;
  };

  const cloneTemplate = (template) => ({
    warmup: (template.warmup || []).map(item => ({ ...item })),
    main: (template.main || []).map(item => ({ ...item })),
    cooldown: (template.cooldown || []).map(item => ({ ...item }))
  });

  const applyExerciseReplacements = (template, replacements) => {
    if (!replacements) return template;
    const applySection = (items) => items.map(item => ({
      ...item,
      exercise: replacements[item.exercise] || item.exercise
    }));
    return {
      ...template,
      warmup: applySection(template.warmup || []),
      main: applySection(template.main || []),
      cooldown: applySection(template.cooldown || [])
    };
  };

  const applyWeekOneAlternatives = (template, week) => {
    if (week !== 1) return template;
    const alternatives = workoutsData.weekOneAlternatives || {};
    const applySection = (items) => items.map(item => {
      const alternative = alternatives[item.exercise];
      if (!alternative) return item;
      return {
        ...item,
        ...alternative,
        exercise: alternative.exercise || item.exercise
      };
    });
    return {
      ...template,
      warmup: applySection(template.warmup || []),
      main: applySection(template.main || []),
      cooldown: applySection(template.cooldown || [])
    };
  };

  const resolveGoalSchedule = (fitnessGoal, fitnessLevel) => {
    const schedules = workoutsData.goalSchedules || {};
    const goalSchedule = schedules[fitnessGoal];
    if (goalSchedule && goalSchedule[fitnessLevel]) {
      return goalSchedule[fitnessLevel];
    }
    return null;
  };

  const generateWorkoutPlan = (userData) => {
    const { fitnessGoal, fitnessLevel, healthProblems } = userData;
    const schedule = workoutsData.weeklySchedule[fitnessLevel];
    const goalPattern = resolveGoalSchedule(fitnessGoal, fitnessLevel);
    const basePattern = goalPattern || schedule.pattern;
    const pattern = goalPattern ? basePattern : adjustScheduleForLevel(basePattern, fitnessLevel);
    const workoutPlan = {};
    
    for (let week = 1; week <= 10; week++) {
      const weekKey = `week${week}`;
      const progressionKey = week <= 2 ? '1-2' : week <= 4 ? '3-4' : week <= 6 ? '5-6' : week <= 8 ? '7-8' : '9-10';
      const progression = rulesData.weeklyProgression[progressionKey];
      
      workoutPlan[weekKey] = {};
      
      pattern.forEach((workoutType, dayIndex) => {
        const dayKey = `day${dayIndex + 1}`;
        if (workoutType === 'rest') {
          workoutPlan[weekKey][dayKey] = {
            type: 'rest',
            title: 'Rest Day',
            description: 'Recovery and light stretching'
          };
        } else {
          let template = workoutsData.workoutTemplates[workoutType] || workoutsData.workoutTemplates.strength;
          template = cloneTemplate(template);
          if (healthProblems && healthProblems.length > 0) {
            healthProblems.forEach(condition => {
              if (workoutsData.modifications[condition]) {
                const modifications = workoutsData.modifications[condition].replace;
                template = applyExerciseReplacements(template, modifications);
              }
            });
          }
          template = applyWeekOneAlternatives(template, week);
          template = addLevelExtras(template, fitnessLevel, week);
          workoutPlan[weekKey][dayKey] = {
            type: workoutType,
            title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Training`,
            phase: progression.phase,
            intensity: progression.intensityMultiplier,
            template: template
          };
        }
      });
    }
    return workoutPlan;
  };

  const generateDietPlan = (userData) => {
    const { fitnessGoal, preferredCuisines, dietaryRestrictions } = userData;
    const goalData = rulesData.goals[fitnessGoal];
    const baseBMR = calculateBMR(userData);
    const targetCalories = Math.round(baseBMR * goalData.calorieMultiplier);

    const dietPlan = {};
    const primaryCuisine = preferredCuisines && preferredCuisines[0] ? preferredCuisines[0] : 'continental';
    const mealTemplates = dietsData.mealTemplates[primaryCuisine];

    for (let week = 1; week <= 10; week++) {
      const weekKey = `week${week}`;
      dietPlan[weekKey] = {};
      for (let day = 1; day <= 7; day++) {
        const dayKey = `day${day}`;
        const mealIndex = (week + day) % 3;
        let meals = {
          breakfast: mealTemplates.breakfast[mealIndex],
          lunch: mealTemplates.lunch[mealIndex],
          snack: mealTemplates.snack[mealIndex],
          dinner: mealTemplates.dinner[mealIndex]
        };
        const dailyCalories = meals.breakfast.calories + meals.lunch.calories + 
                            meals.snack.calories + meals.dinner.calories;
        dietPlan[weekKey][dayKey] = {
          meals,
          totalCalories: dailyCalories,
          targetCalories
        };
      }
    }
    return dietPlan;
  };

  const generateFitnessData = (userData) => {
    const workoutPlan = generateWorkoutPlan(userData);
    const dietPlan = generateDietPlan(userData);
    const bmr = calculateBMR(userData);
    const bmi = calculateBMI(userData);
    const bmiCategory = getBMICategory(bmi);

    return {
      workoutPlan,
      dietPlan,
      bmr,
      bmi,
      bmiCategory,
      targetCalories: Math.round(bmr * rulesData.goals[userData.fitnessGoal].calorieMultiplier),
      startDate: new Date().toISOString().split('T')[0],
      startWeight: userData.weight,
      currentWeight: userData.weight,
      targetWeight: userData.targetWeight || userData.weight
    };
  };

  // --- 2. API ACTIONS ---

  const logout = () => {
    setUser(null);
    setFitnessData(null);
    setIsRegistered(false);
    setProgressSummary(null);
    setRecommendations(null);
    setPredictions(null);
    localStorage.removeItem('token');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      token,
      'Content-Type': 'application/json'
    };
  };

  const fetchDashboardData = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/dashboard', {
        method: 'GET',
        headers: {
          'token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // RECALCULATE METRICS HERE to fix Profile Page
        const bmi = calculateBMI(data.user);
        const bmiCategory = getBMICategory(bmi);
        const bmr = calculateBMR(data.user);

        setUser(data.user);
        setFitnessData({
          ...data.fitnessData,
          bmi,
          bmiCategory,
          bmr
        });
        setIsRegistered(true);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressSummary = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/progress/summary', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load progress summary');

      const data = await response.json();
      setProgressSummary(data);
      return data;
    } catch (err) {
      console.error('Progress summary error:', err);
      return null;
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/recommendations', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load recommendations');

      const data = await response.json();
      setRecommendations(data);
      return data;
    } catch (err) {
      console.error('Recommendations error:', err);
      return null;
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/predictions', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load predictions');

      const data = await response.json();
      setPredictions(data);
      return data;
    } catch (err) {
      console.error('Predictions error:', err);
      return null;
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data);

      localStorage.setItem('token', data.token);
      await fetchDashboardData(data.token); 
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const registerUser = async (formData) => {
    try {
      const generatedPlan = generateFitnessData(formData);

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          generatedPlan: generatedPlan
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Registration failed');

      return true;

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Registration failed: " + error.message);
      return false;
    }
  };

  const updateUser = (updates) => {
    return updateUserProfile(updates);
  };

  const updateUserProfile = async (updates) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Profile update failed');

      const data = await response.json();
      const token = localStorage.getItem('token');
      if (token) {
        await fetchDashboardData(token);
      } else {
        setUser(data.user);
      }
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const logFeedback = async (payload) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/feedback', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Feedback failed');
      return await response.json();
    } catch (error) {
      console.error('Feedback error:', error);
      return null;
    }
  };

  const logProgress = async (payload) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/progress', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Progress log failed');
      return await response.json();
    } catch (error) {
      console.error('Progress log error:', error);
      return null;
    }
  };

  const resetUser = logout;

  // --- 3. INIT ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchDashboardData(token);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      fitnessData,
      progressSummary,
      recommendations,
      predictions,
      isRegistered,
      loading,
      registerUser,
      loginUser,
      updateUser,
      updateUserProfile,
      fetchProgressSummary,
      fetchRecommendations,
      fetchPredictions,
      logFeedback,
      logProgress,
      resetUser,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};
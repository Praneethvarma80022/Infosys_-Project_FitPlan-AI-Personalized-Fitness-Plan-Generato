const router = require('express').Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const authorize = (req, res, next) => {
  const token = req.header('token');
  if (!token) return res.status(403).json('Not Authorized');
  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verify.user_id;
    next();
  } catch (err) {
    res.status(403).json('Invalid Token');
  }
};

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const calculateBMI = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return null;
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
};

const analyzeSentiment = (text) => {
  const value = (text || '').toLowerCase();
  const score = {
    positive: ['great', 'good', 'energized', 'strong', 'happy', 'motivated', 'awesome', 'excellent'],
    negative: ['bad', 'sad', 'pain', 'sore', 'stressed', 'weak', 'down', 'injury'],
    tired: ['tired', 'fatigued', 'exhausted', 'sleepy', 'burned'],
    energetic: ['energetic', 'pumped', 'lively', 'fresh', 'ready']
  };

  const counts = Object.keys(score).reduce((acc, key) => {
    acc[key] = score[key].filter(word => value.includes(word)).length;
    return acc;
  }, {});

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const sentiment = top && top[1] > 0 ? top[0] : 'neutral';
  const intensity = sentiment === 'tired' || sentiment === 'negative' ? 'low' : sentiment === 'energetic' || sentiment === 'positive' ? 'high' : 'moderate';

  return { sentiment, intensity };
};

router.get('/dashboard', authorize, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, g.workout_plan_json, g.diet_plan_json, g.start_date
       FROM user_profiles p
       JOIN generated_plans g ON p.user_id = g.user_id
       WHERE p.user_id = ? AND g.is_active = TRUE`,
      [req.user]
    );

    if (rows.length === 0) return res.status(404).json('User data not found');

    const data = rows[0];
    const workoutPlan = typeof data.workout_plan_json === 'string'
      ? safeJsonParse(data.workout_plan_json, {})
      : data.workout_plan_json;
    const dietPlan = typeof data.diet_plan_json === 'string'
      ? safeJsonParse(data.diet_plan_json, {})
      : data.diet_plan_json;

    const responseData = {
      user: {
        name: data.name,
        age: data.age,
        sex: data.sex,
        pregnancyStatus: data.pregnancy_status,
        location: data.location,
        healthNotes: data.health_notes,
        height: data.height_cm,
        weight: data.current_weight_kg,
        targetWeight: data.target_weight_kg,
        fitnessGoal: data.fitness_goal,
        fitnessLevel: data.fitness_level,
        healthProblems: safeJsonParse(data.health_problems_json, []),
        preferredCuisines: safeJsonParse(data.preferred_cuisines_json, []),
        dietaryRestrictions: safeJsonParse(data.dietary_restrictions_json, []),
        bloodPressure: data.bp_status,
        hasDiabetes: !!data.has_diabetes
      },
      fitnessData: {
        workoutPlan,
        dietPlan,
        targetCalories: data.target_calories,
        startDate: data.start_date,
        startWeight: data.start_weight_kg,
        currentWeight: data.current_weight_kg,
        targetWeight: data.target_weight_kg
      }
    };

    res.json(responseData);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/log-activity', authorize, async (req, res) => {
  try {
    const { week, day, caloriesBurned, workoutMinutes, performanceScore, isCompleted } = req.body;
    const completed = typeof isCompleted === 'boolean' ? isCompleted : true;
    await pool.execute(
      `INSERT INTO daily_activity 
       (user_id, week_number, day_number, is_workout_completed, date_completed, calories_burned, workout_minutes, performance_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         is_workout_completed = VALUES(is_workout_completed),
         date_completed = VALUES(date_completed),
         calories_burned = COALESCE(VALUES(calories_burned), calories_burned),
         workout_minutes = COALESCE(VALUES(workout_minutes), workout_minutes),
         performance_score = COALESCE(VALUES(performance_score), performance_score)`,
      [
        req.user,
        week,
        day,
        completed,
        completed ? new Date() : null,
        caloriesBurned || null,
        workoutMinutes || null,
        performanceScore || null
      ]
    );

    res.json('Activity Logged');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/diet/log', authorize, async (req, res) => {
  try {
    const { date, week, day, mealKey, eaten, calories, protein } = req.body;
    await pool.execute(
      `INSERT INTO meal_logs
       (user_id, logged_date, week_number, day_number, meal_key, is_eaten, calories, protein)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_eaten = VALUES(is_eaten),
         calories = VALUES(calories),
         protein = VALUES(protein)`,
      [
        req.user,
        date || new Date().toISOString().slice(0, 10),
        week,
        day,
        mealKey,
        !!eaten,
        calories || 0,
        protein || 0
      ]
    );

    res.json({ message: 'Meal logged' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/diet/logs', authorize, async (req, res) => {
  try {
    const week = Number(req.query.week || 1);
    const [rows] = await pool.execute(
      `SELECT logged_date, week_number, day_number, meal_key, is_eaten
       FROM meal_logs
       WHERE user_id = ? AND week_number = ?`,
      [req.user, week]
    );

    const result = rows.reduce((acc, row) => {
      const dayKey = `day${row.day_number}`;
      acc[dayKey] = acc[dayKey] || {};
      acc[dayKey][row.meal_key] = !!row.is_eaten;
      return acc;
    }, {});

    res.json({ logs: result });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/profile', authorize, async (req, res) => {
  try {
    const [profiles] = await pool.execute(
      `SELECT * FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );
    if (profiles.length === 0) return res.status(404).json('User not found');

    const profile = profiles[0];
    const [photos] = await pool.execute(
      `SELECT photo_type, photo_data FROM user_photos WHERE user_id = ?`,
      [req.user]
    );

    res.json({
      user: {
        name: profile.name,
        age: profile.age,
        sex: profile.sex,
        pregnancyStatus: profile.pregnancy_status,
        location: profile.location,
        healthNotes: profile.health_notes,
        height: profile.height_cm,
        weight: profile.current_weight_kg,
        targetWeight: profile.target_weight_kg,
        fitnessGoal: profile.fitness_goal,
        fitnessLevel: profile.fitness_level,
        healthProblems: safeJsonParse(profile.health_problems_json, []),
        preferredCuisines: safeJsonParse(profile.preferred_cuisines_json, []),
        dietaryRestrictions: safeJsonParse(profile.dietary_restrictions_json, []),
        bloodPressure: profile.bp_status,
        hasDiabetes: !!profile.has_diabetes
      },
      photos: photos.reduce((acc, photo) => {
        acc[photo.photo_type] = photo.photo_data;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.put('/profile', authorize, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      name,
      age,
      sex,
      height,
      weight,
      targetWeight,
      fitnessGoal,
      fitnessLevel,
      healthProblems,
      preferredCuisines,
      dietaryRestrictions,
      bloodPressure,
      hasDiabetes,
      pregnancyStatus,
      location,
      healthNotes,
      presentPhoto,
      week1Photo
    } = req.body;

    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `SELECT height_cm, current_weight_kg FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );
    const existingProfile = existingRows[0] || {};

    await connection.execute(
      `UPDATE user_profiles SET
        name = COALESCE(?, name),
        age = COALESCE(?, age),
        sex = COALESCE(?, sex),
        height_cm = COALESCE(?, height_cm),
        current_weight_kg = COALESCE(?, current_weight_kg),
        target_weight_kg = COALESCE(?, target_weight_kg),
        fitness_goal = COALESCE(?, fitness_goal),
        fitness_level = COALESCE(?, fitness_level),
        pregnancy_status = COALESCE(?, pregnancy_status),
        location = COALESCE(?, location),
        health_notes = COALESCE(?, health_notes),
        health_problems_json = COALESCE(?, health_problems_json),
        preferred_cuisines_json = COALESCE(?, preferred_cuisines_json),
        dietary_restrictions_json = COALESCE(?, dietary_restrictions_json),
        bp_status = COALESCE(?, bp_status),
        has_diabetes = COALESCE(?, has_diabetes),
        updated_at = NOW()
       WHERE user_id = ?`,
      [
        name || null,
        age || null,
        sex || null,
        height || null,
        weight || null,
        targetWeight || null,
        fitnessGoal || null,
        fitnessLevel || null,
        pregnancyStatus || null,
        location || null,
        healthNotes || null,
        healthProblems ? JSON.stringify(healthProblems) : null,
        preferredCuisines ? JSON.stringify(preferredCuisines) : null,
        dietaryRestrictions ? JSON.stringify(dietaryRestrictions) : null,
        bloodPressure || null,
        typeof hasDiabetes === 'boolean' ? hasDiabetes : null,
        req.user
      ]
    );

    if (weight || height) {
      const resolvedHeight = height || existingProfile.height_cm;
      const resolvedWeight = weight || existingProfile.current_weight_kg;
      const bmi = calculateBMI(resolvedHeight, resolvedWeight);
      await connection.execute(
        `INSERT INTO user_progress (user_id, logged_date, weight_kg, bmi)
         VALUES (?, CURDATE(), ?, ?)
         ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), bmi = VALUES(bmi)`,
        [req.user, resolvedWeight || null, bmi]
      );
    }

    if (presentPhoto) {
      await connection.execute(
        `INSERT INTO user_photos (user_id, photo_type, photo_data)
         VALUES (?, 'present', ?)
         ON DUPLICATE KEY UPDATE photo_data = VALUES(photo_data), uploaded_at = NOW()`,
        [req.user, presentPhoto]
      );
    }

    if (week1Photo) {
      await connection.execute(
        `INSERT INTO user_photos (user_id, photo_type, photo_data)
         VALUES (?, 'week1', ?)
         ON DUPLICATE KEY UPDATE photo_data = VALUES(photo_data), uploaded_at = NOW()`,
        [req.user, week1Photo]
      );
    }

    await connection.commit();

    const [profiles] = await connection.execute(
      `SELECT * FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );

    const profile = profiles[0];
    res.json({
      user: {
        name: profile.name,
        age: profile.age,
        sex: profile.sex,
        height: profile.height_cm,
        weight: profile.current_weight_kg,
        targetWeight: profile.target_weight_kg,
        fitnessGoal: profile.fitness_goal,
        fitnessLevel: profile.fitness_level,
        healthProblems: safeJsonParse(profile.health_problems_json, []),
        preferredCuisines: safeJsonParse(profile.preferred_cuisines_json, []),
        dietaryRestrictions: safeJsonParse(profile.dietary_restrictions_json, []),
        bloodPressure: profile.bp_status,
        hasDiabetes: !!profile.has_diabetes
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
});

router.post('/progress', authorize, async (req, res) => {
  try {
    const { date, weight, caloriesBurned, workoutMinutes, performanceScore, note } = req.body;
    const [profiles] = await pool.execute(
      `SELECT height_cm FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );
    const height = profiles.length ? profiles[0].height_cm : null;
    const bmi = calculateBMI(height, weight);

    await pool.execute(
      `INSERT INTO user_progress
       (user_id, logged_date, weight_kg, bmi, calories_burned, workout_minutes, performance_score, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         weight_kg = VALUES(weight_kg),
         bmi = VALUES(bmi),
         calories_burned = VALUES(calories_burned),
         workout_minutes = VALUES(workout_minutes),
         performance_score = VALUES(performance_score),
         note = VALUES(note)`,
      [req.user, date || new Date().toISOString().slice(0, 10), weight || null, bmi, caloriesBurned || null, workoutMinutes || null, performanceScore || null, note || null]
    );

    if (weight) {
      await pool.execute(
        `UPDATE user_profiles SET current_weight_kg = ? WHERE user_id = ?`,
        [weight, req.user]
      );
    }

    res.json({ message: 'Progress logged' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/progress/summary', authorize, async (req, res) => {
  try {
    const [profileRows] = await pool.execute(
      `SELECT start_weight_kg, current_weight_kg, target_weight_kg, height_cm FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );
    const profile = profileRows[0];

    const [progressRows] = await pool.execute(
      `SELECT logged_date, weight_kg, bmi, calories_burned, workout_minutes, performance_score
       FROM user_progress
       WHERE user_id = ?
       ORDER BY logged_date ASC`,
      [req.user]
    );

    const [activityRows] = await pool.execute(
      `SELECT week_number, day_number, is_workout_completed, date_completed, calories_burned
       FROM daily_activity
       WHERE user_id = ?
       ORDER BY week_number, day_number`,
      [req.user]
    );

    const caloriesByDate = {};
    activityRows.forEach(row => {
      if (!row.date_completed || !row.is_workout_completed) return;
      const dateKey = row.date_completed.toISOString().slice(0, 10);
      caloriesByDate[dateKey] = (caloriesByDate[dateKey] || 0) + (row.calories_burned || 0);
    });

    const workoutCompletion = activityRows.reduce((acc, row) => {
      if (row.is_workout_completed) acc.completed += 1;
      acc.total += 1;
      return acc;
    }, { completed: 0, total: 0 });

    res.json({
      profile: {
        startWeight: profile?.start_weight_kg || null,
        currentWeight: profile?.current_weight_kg || null,
        targetWeight: profile?.target_weight_kg || null,
        height: profile?.height_cm || null
      },
      progress: progressRows,
      caloriesByDate,
      workoutCompletion
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/feedback', authorize, async (req, res) => {
  try {
    const { date, moodText } = req.body;
    const analysis = analyzeSentiment(moodText);

    await pool.execute(
      `INSERT INTO user_feedback (user_id, logged_date, mood_text, sentiment, suggested_intensity)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE mood_text = VALUES(mood_text), sentiment = VALUES(sentiment), suggested_intensity = VALUES(suggested_intensity)`,
      [req.user, date || new Date().toISOString().slice(0, 10), moodText || null, analysis.sentiment, analysis.intensity]
    );

    res.json({
      sentiment: analysis.sentiment,
      intensity: analysis.intensity
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/recommendations', authorize, async (req, res) => {
  try {
    const [profiles] = await pool.execute(
      `SELECT height_cm, current_weight_kg, target_weight_kg, fitness_goal, bp_status, has_diabetes
       FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );
    if (profiles.length === 0) return res.status(404).json('User not found');

    const profile = profiles[0];
    const bmi = calculateBMI(profile.height_cm, profile.current_weight_kg);
    const safeWorkouts = [];
    const dietRestrictions = [];
    const alerts = [];

    if (profile.bp_status && profile.bp_status !== 'normal') {
      safeWorkouts.push('Low-impact cardio', 'Moderate strength training', 'Walking');
      alerts.push('Avoid high-intensity intervals until blood pressure is stable.');
    }

    if (profile.has_diabetes) {
      dietRestrictions.push('Limit added sugars', 'Focus on high-fiber carbs', 'Consistent meal timing');
      safeWorkouts.push('Steady-state cardio', 'Resistance training');
    }

    if (bmi && bmi >= 30) {
      safeWorkouts.push('Joint-friendly cardio', 'Swimming', 'Cycling');
    }

    res.json({
      bmi,
      goal: profile.fitness_goal,
      calorieGuidance: profile.fitness_goal === 'weight_loss' ? 'Mild calorie deficit' : 'Balanced intake',
      safeWorkouts,
      dietRestrictions,
      alerts
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/predictions', authorize, async (req, res) => {
  try {
    const [profileRows] = await pool.execute(
      `SELECT start_weight_kg, current_weight_kg, target_weight_kg
       FROM user_profiles WHERE user_id = ?`,
      [req.user]
    );
    const profile = profileRows[0];

    const [progressRows] = await pool.execute(
      `SELECT logged_date, weight_kg
       FROM user_progress
       WHERE user_id = ?
       ORDER BY logged_date ASC`,
      [req.user]
    );

    if (!profile || progressRows.length < 2) {
      return res.json({
        predictedTargetDate: null,
        weeklyRate: null,
        trend: []
      });
    }

    const first = progressRows[0];
    const last = progressRows[progressRows.length - 1];
    const days = Math.max(1, (new Date(last.logged_date) - new Date(first.logged_date)) / (1000 * 60 * 60 * 24));
    const weeklyRate = ((first.weight_kg - last.weight_kg) / days) * 7;
    const remaining = profile.current_weight_kg && profile.target_weight_kg
      ? profile.current_weight_kg - profile.target_weight_kg
      : null;
    const weeksToGoal = weeklyRate > 0 && remaining !== null ? remaining / weeklyRate : null;
    const predictedTargetDate = weeksToGoal ? new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000) : null;

    const trend = progressRows.map(row => ({
      date: row.logged_date,
      weight: row.weight_kg
    }));

    res.json({
      predictedTargetDate: predictedTargetDate ? predictedTargetDate.toISOString().slice(0, 10) : null,
      weeklyRate: weeklyRate ? Number(weeklyRate.toFixed(2)) : null,
      trend
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
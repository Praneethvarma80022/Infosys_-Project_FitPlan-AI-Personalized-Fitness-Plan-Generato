
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      email, 
      password, 
      name,
      age, sex, pregnancyStatus, location, healthNotes, height, weight, targetWeight,
      fitnessGoal, fitnessLevel,
      healthProblems, preferredCuisines, dietaryRestrictions,
      bloodPressure, hasDiabetes,
      generatedPlan 
    } = req.body;

    await connection.beginTransaction();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hash]
    );
    const userId = userResult.insertId;
    await connection.execute(
      `INSERT INTO user_profiles 
       (user_id, name, age, sex, pregnancy_status, location, health_notes, height_cm, start_weight_kg, current_weight_kg, target_weight_kg, fitness_goal, fitness_level, target_calories, health_problems_json, preferred_cuisines_json, dietary_restrictions_json, bp_status, has_diabetes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name || null,
        age,
        sex,
        pregnancyStatus || null,
        location || null,
        healthNotes || null,
        height,
        weight,
        weight,
        targetWeight || weight,
        fitnessGoal,
        fitnessLevel,
        generatedPlan.targetCalories,
        JSON.stringify(healthProblems || []),
        JSON.stringify(preferredCuisines || []),
        JSON.stringify(dietaryRestrictions || []),
        bloodPressure || null,
        typeof hasDiabetes === 'boolean' ? hasDiabetes : false
      ]
    );

    await connection.execute(
      `INSERT INTO generated_plans (user_id, workout_plan_json, diet_plan_json, start_date)
       VALUES (?, ?, ?, CURDATE())`,
      [userId, JSON.stringify(generatedPlan.workoutPlan), JSON.stringify(generatedPlan.dietPlan)]
    );

    await connection.commit();
    const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user_id: userId, message: 'Registration successful' });

  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    console.error(err);
    res.status(500).json('Server Error');
  } finally {
    connection.release();
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) return res.status(401).json('Invalid Credential');
    
    const validPassword = await bcrypt.compare(password, users[0].password_hash);
    if (!validPassword) return res.status(401).json('Invalid Credential');

    const token = jwt.sign({ user_id: users[0].user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  name VARCHAR(120),
  age INT,
  sex VARCHAR(20),
  pregnancy_status VARCHAR(10),
  location VARCHAR(120),
  health_notes TEXT,
  height_cm DECIMAL(5,2),
  start_weight_kg DECIMAL(6,2),
  current_weight_kg DECIMAL(6,2),
  target_weight_kg DECIMAL(6,2),
  fitness_goal VARCHAR(50),
  fitness_level VARCHAR(50),
  target_calories INT,
  health_problems_json LONGTEXT,
  preferred_cuisines_json LONGTEXT,
  dietary_restrictions_json LONGTEXT,
  bp_status VARCHAR(30),
  has_diabetes BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generated_plans (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workout_plan_json LONGTEXT,
  diet_plan_json LONGTEXT,
  start_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_activity (
  activity_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  week_number INT NOT NULL,
  day_number INT NOT NULL,
  is_workout_completed BOOLEAN DEFAULT FALSE,
  date_completed DATE,
  calories_burned INT,
  workout_minutes INT,
  performance_score INT,
  UNIQUE KEY unique_day (user_id, week_number, day_number),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  logged_date DATE NOT NULL,
  weight_kg DECIMAL(6,2),
  bmi DECIMAL(4,1),
  calories_burned INT,
  workout_minutes INT,
  performance_score INT,
  note TEXT,
  UNIQUE KEY unique_progress_day (user_id, logged_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  logged_date DATE NOT NULL,
  mood_text TEXT,
  sentiment VARCHAR(30),
  suggested_intensity VARCHAR(20),
  UNIQUE KEY unique_feedback_day (user_id, logged_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_photos (
  photo_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  photo_type VARCHAR(30) NOT NULL,
  photo_data LONGTEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_photo_type (user_id, photo_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meal_logs (
  meal_log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  logged_date DATE NOT NULL,
  week_number INT NOT NULL,
  day_number INT NOT NULL,
  meal_key VARCHAR(20) NOT NULL,
  is_eaten BOOLEAN DEFAULT FALSE,
  calories INT,
  protein INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_meal_log (user_id, logged_date, meal_key),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

ALTER TABLE user_profiles
  ADD COLUMN pregnancy_status VARCHAR(10),
  ADD COLUMN location VARCHAR(120),
  ADD COLUMN health_notes TEXT;
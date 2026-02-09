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

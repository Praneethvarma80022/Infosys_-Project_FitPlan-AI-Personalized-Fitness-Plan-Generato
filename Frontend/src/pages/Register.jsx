import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/useUser';

const Register = () => {
  const navigate = useNavigate();
  const { registerUser } = useUser();
  
  const [formData, setFormData] = useState({
    email: '',       // Added for Backend
    password: '',    // Added for Backend
    name: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    targetWeight: '',
    fitnessGoal: '',
    fitnessLevel: '',
    healthProblems: [],
    preferredCuisines: [],
    dietaryRestrictions: [],
    bloodPressure: 'normal',
    hasDiabetes: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Increased to 5 to include Account Setup

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // registerUser is now async in UserContext, so we wait for it
    const success = await registerUser(formData);
    if (success) {
      navigate('/dashboard');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Account Info
        return formData.email && formData.password.length >= 6;
      case 2: // Basic Stats
        return formData.name && formData.age && formData.sex && formData.height && formData.weight && formData.targetWeight;
      case 3: // Goals
        return formData.fitnessGoal && formData.fitnessLevel;
      case 4: // Health (Optional)
        return true; 
      case 5: // Diet
        return formData.preferredCuisines.length > 0;
      default:
        return false;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div className="container">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                Fitness Assessment
              </h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <p style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-gray)' }}>
                Step {currentStep} of {totalSteps}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* STEP 1: ACCOUNT SETUP (New) */}
              {currentStep === 1 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem' }}>Account Setup</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password (min 6 chars)"
                      required
                    />
                  </div>
                  
                  <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{color: 'var(--fitness-green)'}}>Login here</Link>
                  </p>
                </div>
              )}

              {/* STEP 2: BASIC INFO (Previously Step 1) */}
              {currentStep === 2 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem' }}>Basic Information</h3>

                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Enter your age"
                      min="16"
                      max="80"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sex</label>
                    <div className="checkbox-group">
                      {['male', 'female', 'other'].map(option => (
                        <div
                          key={option}
                          className={`checkbox-item ${formData.sex === option ? 'selected' : ''}`}
                          onClick={() => handleInputChange('sex', option)}
                        >
                          <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Height (cm)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="Enter your height in cm"
                      min="120"
                      max="220"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="Enter your weight in kg"
                      min="30"
                      max="200"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Weight (kg)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.targetWeight}
                      onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                      placeholder="Enter your goal weight"
                      min="30"
                      max="200"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: GOALS (Previously Step 2) */}
              {currentStep === 3 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem' }}>Fitness Goals & Level</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Fitness Goal</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'weight_loss', label: 'Weight Loss' },
                        { key: 'muscle_gain', label: 'Muscle Gain' },
                        { key: 'fat_loss_toning', label: 'Fat Loss + Toning' },
                        { key: 'general_fitness', label: 'General Fitness' },
                        { key: 'endurance', label: 'Endurance Improvement' }
                      ].map(goal => (
                        <div
                          key={goal.key}
                          className={`checkbox-item ${formData.fitnessGoal === goal.key ? 'selected' : ''}`}
                          onClick={() => handleInputChange('fitnessGoal', goal.key)}
                        >
                          <span>{goal.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fitness Level</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'beginner', label: 'Beginner' },
                        { key: 'intermediate', label: 'Intermediate' },
                        { key: 'advanced', label: 'Advanced' }
                      ].map(level => (
                        <div
                          key={level.key}
                          className={`checkbox-item ${formData.fitnessLevel === level.key ? 'selected' : ''}`}
                          onClick={() => handleInputChange('fitnessLevel', level.key)}
                        >
                          <span>{level.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: HEALTH (Previously Step 3) */}
              {currentStep === 4 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem' }}>Health Considerations</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Health Problems (Select all that apply)</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'none', label: 'None' },
                        { key: 'knee_pain', label: 'Knee Pain' },
                        { key: 'back_pain', label: 'Back Pain' },
                        { key: 'heart_condition', label: 'Heart Condition' },
                        { key: 'diabetes', label: 'Diabetes' },
                        { key: 'asthma', label: 'Asthma' }
                      ].map(problem => (
                        <div
                          key={problem.key}
                          className={`checkbox-item ${formData.healthProblems.includes(problem.key) ? 'selected' : ''}`}
                          onClick={() => handleMultiSelect('healthProblems', problem.key)}
                        >
                          <span>{problem.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Pressure</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'normal', label: 'Normal' },
                        { key: 'elevated', label: 'Elevated' },
                        { key: 'high', label: 'High' }
                      ].map(option => (
                        <div
                          key={option.key}
                          className={`checkbox-item ${formData.bloodPressure === option.key ? 'selected' : ''}`}
                          onClick={() => handleInputChange('bloodPressure', option.key)}
                        >
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Diabetes</label>
                    <div className="checkbox-group">
                      {[
                        { key: true, label: 'Yes' },
                        { key: false, label: 'No' }
                      ].map(option => (
                        <div
                          key={option.label}
                          className={`checkbox-item ${formData.hasDiabetes === option.key ? 'selected' : ''}`}
                          onClick={() => handleInputChange('hasDiabetes', option.key)}
                        >
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: DIET (Previously Step 4) */}
              {currentStep === 5 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem' }}>Dietary Preferences</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Preferred Meal Cuisines</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'indian', label: 'Indian' },
                        { key: 'continental', label: 'Continental' },
                        { key: 'mediterranean', label: 'Mediterranean' },
                        { key: 'asian', label: 'Asian' },
                        { key: 'keto', label: 'Keto-style' },
                        { key: 'vegan', label: 'Vegan' }
                      ].map(cuisine => (
                        <div
                          key={cuisine.key}
                          className={`checkbox-item ${formData.preferredCuisines.includes(cuisine.key) ? 'selected' : ''}`}
                          onClick={() => handleMultiSelect('preferredCuisines', cuisine.key)}
                        >
                          <span>{cuisine.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dietary Restrictions</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'none', label: 'No Restrictions' },
                        { key: 'vegetarian', label: 'Vegetarian' },
                        { key: 'vegan', label: 'Vegan' },
                        { key: 'eggitarian', label: 'Eggitarian' },
                        { key: 'lactose_intolerant', label: 'Lactose Intolerant' },
                        { key: 'gluten_free', label: 'Gluten Free' }
                      ].map(restriction => (
                        <div
                          key={restriction.key}
                          className={`checkbox-item ${formData.dietaryRestrictions.includes(restriction.key) ? 'selected' : ''}`}
                          onClick={() => handleMultiSelect('dietaryRestrictions', restriction.key)}
                        >
                          <span>{restriction.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '2rem' 
              }}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn"
                    style={{ backgroundColor: 'var(--text-gray)', color: 'white' }}
                  >
                    Previous
                  </button>
                )}
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary"
                    disabled={!isStepValid()}
                    style={{ 
                      marginLeft: 'auto',
                      opacity: isStepValid() ? 1 : 0.5,
                      cursor: isStepValid() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={!isStepValid()}
                    style={{ 
                      marginLeft: 'auto',
                      opacity: isStepValid() ? 1 : 0.5,
                      cursor: isStepValid() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Generate My Plan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
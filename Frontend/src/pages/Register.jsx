import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useUser } from '../context/useUser';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/[0-9]/, 'Add at least one number')
  .regex(/[^A-Za-z0-9]/, 'Add at least one special character');

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Personal' },
  { id: 3, label: 'Body' },
  { id: 4, label: 'Fitness' },
  { id: 5, label: 'Health' }
];

const Register = () => {
  const navigate = useNavigate();
  const { registerUser } = useUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: '',
    pregnancyStatus: '',
    location: '',
    height: '',
    weight: '',
    targetWeight: '',
    fitnessGoal: '',
    fitnessLevel: '',
    preferredCuisines: [],
    dietaryRestrictions: [],
    healthProblems: [],
    healthNotes: '',
    bloodPressure: 'normal',
    hasDiabetes: false,
    email: '',
    password: '',
    confirmPassword: ''
  });

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

  const getNumberValue = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const ageNumber = getNumberValue(formData.age);
  const heightNumber = getNumberValue(formData.height);
  const weightNumber = getNumberValue(formData.weight);
  const targetWeightNumber = getNumberValue(formData.targetWeight);

  const isPregnancyEligible = ageNumber >= 18 && ageNumber <= 50 && formData.sex === 'female';

  useEffect(() => {
    if (!isPregnancyEligible && formData.pregnancyStatus) {
      setFormData(prev => ({ ...prev, pregnancyStatus: '' }));
    }
  }, [isPregnancyEligible, formData.pregnancyStatus]);

  const bmiValue = useMemo(() => {
    if (heightNumber > 0 && weightNumber > 0) {
      const heightMeters = heightNumber / 100;
      return (weightNumber / (heightMeters * heightMeters)).toFixed(1);
    }
    return '--';
  }, [heightNumber, weightNumber]);

  const stepSchemas = {
    1: z.object({
      email: z.string().email('Valid email is required'),
      password: passwordSchema,
      confirmPassword: z.string().min(1, 'Confirm your password')
    }).refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match'
    }),
    2: z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().min(13, 'Age must be at least 13'),
      sex: z.enum(['male', 'female', 'other'], {
        errorMap: () => ({ message: 'Gender is required' })
      }),
      location: z.string().optional()
    }),
    3: z.object({
      height: z.number().positive('Height must be a positive number'),
      weight: z.number().positive('Weight must be a positive number')
    }),
    4: z.object({
      targetWeight: z.number().positive('Target weight must be a positive number'),
      fitnessGoal: z.string().min(1, 'Fitness goal is required'),
      fitnessLevel: z.string().min(1, 'Fitness level is required'),
      preferredCuisines: z.array(z.string()).min(1, 'Select at least one cuisine')
    }),
    5: z.object({})
  };

  const stepErrors = useMemo(() => {
    let errors = {};
    const schema = stepSchemas[currentStep];

    if (schema) {
      const payload = {
        name: formData.name.trim(),
        age: ageNumber,
        sex: formData.sex,
        location: formData.location.trim() || undefined,
        height: heightNumber,
        weight: weightNumber,
        targetWeight: targetWeightNumber,
        fitnessGoal: formData.fitnessGoal,
        fitnessLevel: formData.fitnessLevel,
        preferredCuisines: formData.preferredCuisines,
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      const result = schema.safeParse(payload);
      if (!result.success) {
        result.error.errors.forEach(err => {
          const field = err.path[0];
          if (field) errors[field] = err.message;
        });
      }
    }

    if (currentStep === 2 && isPregnancyEligible && !formData.pregnancyStatus) {
      errors.pregnancyStatus = 'Select pregnancy status';
    }

    return errors;
  }, [currentStep, formData, ageNumber, heightNumber, weightNumber, targetWeightNumber, isPregnancyEligible]);

  const isStepValid = Object.keys(stepErrors).length === 0;

  const goNext = () => {
    setAttemptedNext(true);
    if (!isStepValid) return;
    setAttemptedNext(false);
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const goBack = () => {
    setAttemptedNext(false);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAttemptedNext(true);
    if (!isStepValid) return;

    const payload = {
      ...formData,
      age: ageNumber,
      height: heightNumber,
      weight: weightNumber,
      targetWeight: Number.isFinite(targetWeightNumber) ? targetWeightNumber : weightNumber,
      healthProblems: formData.healthProblems.filter(item => item !== 'none')
    };

    const success = await registerUser(payload);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div className="card register-card">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                Personalized Fitness Registration
              </h2>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
                {steps.map(step => (
                  <span
                    key={step.id}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: currentStep === step.id ? '#f97316' : '#e5e7eb',
                      color: currentStep === step.id ? 'white' : '#374151'
                    }}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--text-gray)' }}>
                Step {currentStep} of {steps.length}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <div>
                  <h3 style={{ marginBottom: '1.25rem' }}>Account Security</h3>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                    {(attemptedNext || formData.email) && stepErrors.email && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.email}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        className="form-input"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {(attemptedNext || formData.password) && stepErrors.password && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.password}</div>
                    )}
                    <div style={{ color: 'var(--text-gray)', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                      Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        className="form-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Re-enter your password"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {(attemptedNext || formData.confirmPassword) && stepErrors.confirmPassword && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.confirmPassword}</div>
                    )}
                  </div>

                  <div className="card register-note-card">
                    <p className="register-note-title">Data Privacy</p>
                    <p className="register-note">
                      All personal and health information is encrypted and used only to personalize the fitness plan.
                    </p>
                  </div>

                  <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-gray)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--fitness-green)' }}>Login here</Link>
                  </p>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 style={{ marginBottom: '1.25rem' }}>Personal Information</h3>

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                    {(attemptedNext || formData.name) && stepErrors.name && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      className="form-input"
                      type="number"
                      min="13"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Enter your age"
                    />
                    {(attemptedNext || formData.age) && stepErrors.age && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.age}</div>
                    )}
                    {ageNumber > 0 && ageNumber < 18 && (
                      <div style={{ color: '#d97706', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                        Users under 18 should have parental/guardian supervision and medical clearance before starting any fitness program.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
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
                    {(attemptedNext || formData.sex) && stepErrors.sex && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.sex}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pregnancy Status</label>
                    <div className="radio-group">
                      {['yes', 'no'].map(option => (
                        <label
                          key={option}
                          className={`radio-pill ${formData.pregnancyStatus === option ? 'selected' : ''} ${!isPregnancyEligible ? 'disabled' : ''}`}
                        >
                          <input
                            type="radio"
                            name="pregnancyStatus"
                            value={option}
                            disabled={!isPregnancyEligible}
                            checked={formData.pregnancyStatus === option}
                            onChange={() => handleInputChange('pregnancyStatus', option)}
                          />
                          <span>{option === 'yes' ? 'Yes' : 'No'}</span>
                        </label>
                      ))}
                    </div>
                    {!isPregnancyEligible && (
                      <div style={{ color: 'var(--text-gray)', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                        Select age 18-50 and gender female to unlock pregnancy status.
                      </div>
                    )}
                    {isPregnancyEligible && (attemptedNext || formData.pregnancyStatus) && stepErrors.pregnancyStatus && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.pregnancyStatus}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location (City, Country)</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Example: Hyderabad, India"
                    />
                    <div style={{ color: 'var(--text-gray)', marginTop: '0.35rem', fontSize: '0.85rem' }}>Optional</div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 style={{ marginBottom: '1.25rem' }}>Body Measurements</h3>

                  <div className="form-group">
                    <label className="form-label">Height (cm)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="Enter height in cm"
                    />
                    {(attemptedNext || formData.height) && stepErrors.height && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.height}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="Enter weight in kg"
                    />
                    {(attemptedNext || formData.weight) && stepErrors.weight && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.weight}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Body Mass Index (BMI)</label>
                    <div className="card register-note-card">
                      <strong style={{ fontSize: '1.1rem' }}>{bmiValue}</strong>
                      <div className="register-note register-note--spaced">
                        Calculated from height and weight
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 style={{ marginBottom: '1.25rem' }}>Fitness Preferences</h3>

                  <div className="form-group">
                    <label className="form-label">Target Weight (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={formData.targetWeight}
                      onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                      placeholder="Target weight"
                    />
                    {(attemptedNext || formData.targetWeight) && stepErrors.targetWeight && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.targetWeight}</div>
                    )}
                  </div>

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
                    {(attemptedNext || formData.fitnessGoal) && stepErrors.fitnessGoal && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.fitnessGoal}</div>
                    )}
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
                    {(attemptedNext || formData.fitnessLevel) && stepErrors.fitnessLevel && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.fitnessLevel}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Cuisines</label>
                    <div className="checkbox-group">
                      {[
                        { key: 'indian', label: 'Indian' },
                        { key: 'continental', label: 'Continental' },
                        { key: 'mediterranean', label: 'Mediterranean' },
                        { key: 'asian', label: 'Asian' },
                        { key: 'keto', label: 'Keto Style' },
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
                    {(attemptedNext || formData.preferredCuisines.length > 0) && stepErrors.preferredCuisines && (
                      <div style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.85rem' }}>{stepErrors.preferredCuisines}</div>
                    )}
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
                    <div style={{ color: 'var(--text-gray)', marginTop: '0.35rem', fontSize: '0.85rem' }}>Optional</div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <h3 style={{ marginBottom: '1.25rem' }}>Health Information</h3>

                  <div className="form-group">
                    <label className="form-label">Health Issues</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={formData.healthNotes}
                      onChange={(e) => handleInputChange('healthNotes', e.target.value)}
                      placeholder="Low BP, Asthma, Diabetes, None"
                    />
                    <div style={{ color: 'var(--text-gray)', marginTop: '0.35rem', fontSize: '0.85rem' }}>Optional</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Health Conditions (Select all that apply)</label>
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
                    <div style={{ color: 'var(--text-gray)', marginTop: '0.35rem', fontSize: '0.85rem' }}>Optional</div>
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
                      {[true, false].map(option => (
                        <div
                          key={String(option)}
                          className={`checkbox-item ${formData.hasDiabetes === option ? 'selected' : ''}`}
                          onClick={() => handleInputChange('hasDiabetes', option)}
                        >
                          <span>{option ? 'Yes' : 'No'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                {currentStep > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={goBack}>
                    Back
                  </button>
                )}
                {currentStep < steps.length && (
                  <button type="button" className="btn btn-primary" onClick={goNext} disabled={!isStepValid}>
                    Continue
                  </button>
                )}
                {currentStep === steps.length && (
                  <button type="submit" className="btn btn-primary" disabled={!isStepValid}>
                    Create Account
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

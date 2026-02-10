import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useUser } from '../context/useUser';

const Profile = () => {
  const { user, updateUser, logout, fitnessData } = useUser(); // Destructure logout
  const navigate = useNavigate(); // Hook for redirection
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(user || {});
  const [photos, setPhotos] = useState({ present: null, week1: null });
  const [photoNames, setPhotoNames] = useState({ present: '', week1: '' });

  // Safety check: Don't render if data is missing
  if (!user || !fitnessData) {
    return (
      <div className="page-loader">
        <p className="page-loader__text">Loading Profile...</p>
      </div>
    );
  }

  useEffect(() => {
    if (user) {
      setEditData(user);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const loadPhotos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/user/profile', {
          method: 'GET',
          headers: {
            token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) return;
        const data = await response.json();
        setPhotos({
          present: data.photos?.present || null,
          week1: data.photos?.week1 || null
        });
      } catch (err) {
        console.error('Photo load failed:', err);
      }
    };

    loadPhotos();
  }, []);

  const handleSave = async () => {
    const success = await updateUser(editData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    // We treat "Reset" as Logout for now, since we handle data in the backend
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login'); // Redirect to login page
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setEditData(prev => {
      const currentArray = prev[field] || []; // Ensure array exists
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const handlePhotoChange = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const photoKey = field === 'presentPhoto' ? 'present' : 'week1';
      setEditData(prev => ({ ...prev, [field]: base64 }));
      setPhotos(prev => ({ ...prev, [photoKey]: base64 }));
      await updateUser({ [field]: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoInput = (field, file, nameKey) => {
    if (!file) return;
    setPhotoNames(prev => ({ ...prev, [nameKey]: file.name }));
    handlePhotoChange(field, file);
  };

  const startWeight = fitnessData?.startWeight || user.weight;
  const targetWeight = user.targetWeight || fitnessData?.targetWeight || user.weight;
  const currentWeight = user.weight;
  const goalDelta = startWeight - targetWeight;
  const progressDelta = startWeight - currentWeight;
  const goalPercent = goalDelta > 0 ? Math.min(100, Math.max(0, (progressDelta / goalDelta) * 100)) : 0;
  const bmiTone = (fitnessData.bmiCategory?.category || '').toLowerCase();
  const bmiToneClass = bmiTone.includes('under')
    ? 'bmi-tone--under'
    : bmiTone.includes('normal')
      ? 'bmi-tone--normal'
      : bmiTone.includes('overweight')
        ? 'bmi-tone--over'
        : bmiTone.includes('obese')
          ? 'bmi-tone--obese'
          : 'bmi-tone--neutral';

  return (
    <div className="page page--light profile-page">
      <header className="page-hero page-hero--primary">
        <div className="container page-hero__content">
          <div className="page-hero__title">
            <div>
              <h1 className="page-hero__headline">
                Profile Settings
              </h1>
              <p className="page-hero__lede">
                Manage your fitness profile and preferences
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-link">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container section-spacing">
        <div className="profile-content">
          
          {/* Basic Information */}
          <div className="card profile-card card--spaced">
            <div className="profile-header">
              <h3 className="section-title">Basic Information</h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="profile-header__actions">
                  <button 
                    onClick={handleSave}
                    className="btn btn-primary"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(user);
                    }}
                    className="btn btn-muted"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                ) : (
                  <p className="profile-field">
                    {user.name || 'Not set'}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={editData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                ) : (
                  <p className="profile-field">
                    {user.age} years
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Sex</label>
                {isEditing ? (
                  <div className="checkbox-group">
                    {['male', 'female', 'other'].map(option => (
                      <div
                        key={option}
                        className={`checkbox-item ${editData.sex === option ? 'selected' : ''}`}
                        onClick={() => handleInputChange('sex', option)}
                      >
                        <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="profile-field">
                    {user.sex ? (user.sex.charAt(0).toUpperCase() + user.sex.slice(1)) : ''}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Height</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={editData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                ) : (
                  <p className="profile-field">
                    {user.height} cm
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Current Weight</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={editData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                  />
                ) : (
                  <div>
                    <p className="profile-field profile-field--spaced">
                      {user.weight} kg
                    </p>
                    {fitnessData.bmi && (
                      <p className={`profile-bmi ${bmiToneClass}`}>
                        BMI: {fitnessData.bmi} ({fitnessData.bmiCategory?.category || ''})
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Target Weight</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={editData.targetWeight || ''}
                    onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                  />
                ) : (
                  <p className="profile-field">
                    {user.targetWeight ? `${user.targetWeight} kg` : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          <div className="card profile-card card--spaced">
            <h3 className="section-title">Fitness Goals</h3>
            
            <div className="form-group">
              <label className="form-label">Current Goal</label>
              {isEditing ? (
                <div className="checkbox-group">
                  {['weight_loss', 'muscle_gain', 'fat_loss_toning', 'general_fitness', 'endurance'].map(goal => (
                    <div
                      key={goal}
                      className={`checkbox-item ${editData.fitnessGoal === goal ? 'selected' : ''}`}
                      onClick={() => handleInputChange('fitnessGoal', goal)}
                    >
                      <span>{goal.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-field">
                  {user.fitnessGoal ? user.fitnessGoal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
                </p>
              )}
            </div>

            <div className="form-group profile-form-group--spaced">
              <label className="form-label">Fitness Level</label>
              {isEditing ? (
                <div className="checkbox-group">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <div
                      key={level}
                      className={`checkbox-item ${editData.fitnessLevel === level ? 'selected' : ''}`}
                      onClick={() => handleInputChange('fitnessLevel', level)}
                    >
                      <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-field">
                  {user.fitnessLevel ? (user.fitnessLevel.charAt(0).toUpperCase() + user.fitnessLevel.slice(1)) : ''}
                </p>
              )}
            </div>
          </div>

          {/* Health & Diet */}
          <div className="card profile-card card--spaced">
            <h3 className="section-title">Health & Dietary Preferences</h3>
            
            <div className="form-group">
              <label className="form-label">Health Problems</label>
              {isEditing ? (
                <div className="checkbox-group">
                  {['none', 'knee_pain', 'back_pain', 'heart_condition', 'diabetes', 'asthma'].map(problem => (
                    <div
                      key={problem}
                      className={`checkbox-item ${editData.healthProblems?.includes(problem) ? 'selected' : ''}`}
                      onClick={() => handleMultiSelect('healthProblems', problem)}
                    >
                      <span>{problem.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-field">
                  {user.healthProblems && user.healthProblems.length > 0 ? user.healthProblems.join(', ') : 'None'}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Blood Pressure</label>
              {isEditing ? (
                <div className="checkbox-group">
                  {['normal', 'elevated', 'high'].map(option => (
                    <div
                      key={option}
                      className={`checkbox-item ${editData.bloodPressure === option ? 'selected' : ''}`}
                      onClick={() => handleInputChange('bloodPressure', option)}
                    >
                      <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-field">
                  {user.bloodPressure ? user.bloodPressure.charAt(0).toUpperCase() + user.bloodPressure.slice(1) : 'Not set'}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Diabetes</label>
              {isEditing ? (
                <div className="checkbox-group">
                  {[true, false].map(value => (
                    <div
                      key={String(value)}
                      className={`checkbox-item ${editData.hasDiabetes === value ? 'selected' : ''}`}
                      onClick={() => handleInputChange('hasDiabetes', value)}
                    >
                      <span>{value ? 'Yes' : 'No'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-field">
                  {user.hasDiabetes ? 'Yes' : 'No'}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Cuisines</label>
              {isEditing ? (
                <div className="checkbox-group">
                  {['indian', 'continental', 'mediterranean', 'asian', 'keto', 'vegan'].map(cuisine => (
                    <div
                      key={cuisine}
                      className={`checkbox-item ${editData.preferredCuisines?.includes(cuisine) ? 'selected' : ''}`}
                      onClick={() => handleMultiSelect('preferredCuisines', cuisine)}
                    >
                      <span>{cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-field">
                  {user.preferredCuisines && user.preferredCuisines.length > 0 ? user.preferredCuisines.join(', ') : 'None'}
                </p>
              )}
            </div>
          </div>

          <div className="card profile-card card--spaced">
            <h3 className="section-title">Progress Photos</h3>
            <p className="profile-section-subtitle">
              Uploads save instantly and appear across your dashboard.
            </p>
            <div className="photo-grid">
              <div className="photo-upload">
                <label className="form-label" htmlFor="presentPhoto">Present Photo</label>
                {photos.present ? (
                  <img className="photo-upload__preview" src={photos.present} alt="Present" />
                ) : (
                  <div className="photo-upload__placeholder">No photo uploaded yet</div>
                )}
                <div className="photo-upload__action">
                  <input
                    id="presentPhoto"
                    type="file"
                    accept="image/*"
                    className="photo-upload__input"
                    onChange={(e) => handlePhotoInput('presentPhoto', e.target.files[0], 'present')}
                  />
                  <label className="photo-upload__button" htmlFor="presentPhoto">Choose file</label>
                  <span className="photo-upload__meta">{photoNames.present || 'No file chosen'}</span>
                </div>
              </div>
              <div className="photo-upload">
                <label className="form-label" htmlFor="week1Photo">After One Week Photo</label>
                {photos.week1 ? (
                  <img className="photo-upload__preview" src={photos.week1} alt="Week 1" />
                ) : (
                  <div className="photo-upload__placeholder">No photo uploaded yet</div>
                )}
                <div className="photo-upload__action">
                  <input
                    id="week1Photo"
                    type="file"
                    accept="image/*"
                    className="photo-upload__input"
                    onChange={(e) => handlePhotoInput('week1Photo', e.target.files[0], 'week1')}
                  />
                  <label className="photo-upload__button" htmlFor="week1Photo">Choose file</label>
                  <span className="photo-upload__meta">{photoNames.week1 || 'No file chosen'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card profile-card card--spaced">
            <h3 className="section-title">Goal Tracking</h3>
            <div className="profile-progress__header">
              <span>{startWeight} kg → {targetWeight} kg</span>
              <span>{goalPercent.toFixed(0)}%</span>
            </div>
            <progress className="progress-bar" max="100" value={goalPercent} />
            <p className="profile-progress__note">
              Remaining: {Math.max(0, currentWeight - targetWeight)} kg
            </p>
          </div>

          {/* Logout Zone */}
          <div className="card profile-card profile-card--danger card--spaced">
            <h3 className="profile-danger__title">Logout</h3>
            <p className="profile-danger__text">
              Sign out of your account on this device.
            </p>
            <button 
              onClick={handleReset}
              className="btn profile-danger__btn"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Removed BrowserRouter import
import { UserProvider } from './context/UserContext';
import { useUser } from './context/useUser';

import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkoutDay from './pages/WorkoutDay';
import DietWeek from './pages/DietWeek';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import PlanOverview from './pages/PlanOverview';

const ProtectedRoute = ({ children }) => {
  const { isRegistered, loading } = useUser();
  
  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', marginTop: '2rem'}}>Loading...</div>; 
  }
  
  return isRegistered ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isRegistered } = useUser();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      {/* Public Routes */}
      <Route path="/register" element={isRegistered ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/login" element={isRegistered ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/plan/overview" element={<ProtectedRoute><PlanOverview /></ProtectedRoute>} />
      <Route path="/plan/workout/:week/:day" element={<ProtectedRoute><WorkoutDay /></ProtectedRoute>} />
      <Route path="/plan/diet/:week" element={<ProtectedRoute><DietWeek /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      {/* Router was removed from here because it's now in main.jsx */}
      <div className="App">
        <AppRoutes />
      </div>
    </UserProvider>
  );
}

export default App;
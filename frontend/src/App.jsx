import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import MaintainerDashboard from './components/MaintainerDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('attendsphere_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isMongoConnected, setIsMongoConnected] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = (type, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check backend & MongoDB connection status periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setIsMongoConnected(data.isMongoConnected);
      } catch {
        setIsMongoConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('attendsphere_user', JSON.stringify(user));
    showToast('success', `Welcome back, ${user.name}! Signed in as ${user.role}.`);
  };

  const handleLogout = () => {
    const name = currentUser?.name || 'User';
    setCurrentUser(null);
    localStorage.removeItem('attendsphere_user');
    showToast('info', `${name} signed out successfully.`);
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        isMongoConnected={isMongoConnected}
      />

      <main className="main-content">
        {!currentUser ? (
          <Login
            onLoginSuccess={handleLoginSuccess}
            isMongoConnected={isMongoConnected}
          />
        ) : (
          <>
            {currentUser.role === 'maintainer' && (
              <MaintainerDashboard
                currentUser={currentUser}
                onNotify={showToast}
              />
            )}

            {currentUser.role === 'faculty' && (
              <FacultyDashboard
                currentUser={currentUser}
                onNotify={showToast}
              />
            )}

            {currentUser.role === 'student' && (
              <StudentDashboard
                currentUser={currentUser}
                onNotify={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {t.type === 'success' && <CheckCircle2 size={18} />}
              {t.type === 'error' && <AlertCircle size={18} />}
              {t.type === 'info' && <Info size={18} />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2, opacity: 0.7 }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

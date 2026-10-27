import React, { useState } from 'react';
import { Shield, BookOpen, UserCheck, KeyRound, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login({ onLoginSuccess, isMongoConnected }) {
  const [selectedRole, setSelectedRole] = useState('maintainer');
  const [email, setEmail] = useState('maintainer@college.edu');
  const [password, setPassword] = useState('adminpassword');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Role info & demo credentials with exact color palette
  const roleConfig = {
    maintainer: {
      title: 'Maintainer / Admin',
      subtitle: 'Create & manage faculty, students, and system credentials in MongoDB',
      icon: Shield,
      color: '#FF6A00', // Neon Orange
      demoEmail: 'maintainer@college.edu',
      demoPass: 'adminpassword',
      badge: 'Full Access',
    },
    faculty: {
      title: 'Faculty / Instructor',
      subtitle: 'Take student attendance, mark Present/Absent, and track history',
      icon: BookOpen,
      color: '#BF5AF2', // Neon Purple
      demoEmail: 'sarah.faculty@college.edu',
      demoPass: 'faculty123',
      badge: 'Attendance Marking',
    },
    student: {
      title: 'Student Portal',
      subtitle: 'View attendance percentage, subject logs, and compliance records',
      icon: UserCheck,
      color: '#00F5FF', // Neon Cyan
      demoEmail: 'alex.student@college.edu',
      demoPass: 'student123',
      badge: 'Attendance Records',
    },
  };

  const handleRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    setEmail(roleConfig[roleKey].demoEmail);
    setPassword(roleConfig[roleKey].demoPass);
    setErrorMessage('');
  };

  const handleQuickFill = () => {
    setEmail(roleConfig[selectedRole].demoEmail);
    setPassword(roleConfig[selectedRole].demoPass);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: selectedRole,
        }),
      });

      let data = null;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        if (response.status === 404) {
          throw new Error('Backend route not found (404). Frontend cannot reach the backend API. Please configure VITE_API_URL or vercel.json.');
        } else if (response.status === 500) {
          throw new Error('Backend server error (500). Please ensure MONGODB_URI is set in Vercel Project Settings.');
        } else if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(`Server temporarily unavailable (${response.status}). Please check database connection.`);
        } else {
          throw new Error(`Server returned unexpected response (${response.status}).`);
        }
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Login failed. Please verify credentials.');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentRoleIcon = roleConfig[selectedRole].icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 className="animated-gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 8 }}>
          Attendance System Portal
        </h1>
        <p style={{ color: 'var(--dust-text)', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>
          Select your portal role below to sign in. All accounts and attendance logs are securely stored in MongoDB Atlas.
        </p>
      </div>

      <div className="glass-panel animated-gradient-border" style={{ width: '100%', maxWidth: 480, padding: 32 }}>
        {/* Role Selection Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: 6,
            background: '#0f0f0f',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            border: '1px solid var(--dust-border)',
          }}
        >
          {Object.keys(roleConfig).map((key) => {
            const role = roleConfig[key];
            const Icon = role.icon;
            const isSelected = selectedRole === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleRoleChange(key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? `1px solid ${role.color}` : '1px solid transparent',
                  background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--dust-text)',
                  boxShadow: isSelected ? `0 0 12px ${role.color}40` : 'none',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  transition: 'all 0.25s ease',
                }}
              >
                <Icon size={18} style={{ color: isSelected ? role.color : 'inherit' }} />
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Role Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: '#1a1a1a',
            border: '1px solid var(--dust-border)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${roleConfig[selectedRole].color}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: roleConfig[selectedRole].color,
              boxShadow: `0 0 10px ${roleConfig[selectedRole].color}30`,
            }}
          >
            <CurrentRoleIcon size={20} />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {roleConfig[selectedRole].title}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--dust-text)' }}>
              {roleConfig[selectedRole].subtitle}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="animate-fade-in"
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 59, 48, 0.14)',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              color: '#ffd6d6',
              fontSize: '0.85rem',
              textAlign: 'left',
              marginBottom: 20,
              lineHeight: 1.4,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="email"
                required
                className="form-input"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <Mail
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--dust-dim)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <KeyRound
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--dust-dim)' }}
              />
            </div>
          </div>

          {/* Quick Demo Fill Button: Neon Cyan (#00F5FF) for links & glow effects */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{
                background: 'none',
                border: 'none',
                color: '#00F5FF',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={13} />
              <span>Auto-fill Demo Credentials</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--dust-dim)' }}>
              Role: <strong style={{ color: roleConfig[selectedRole].color }}>{selectedRole}</strong>
            </span>
          </div>

          {/* Primary Action Button: Neon Orange (#FF6A00) */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '0.95rem',
            }}
          >
            {isLoading ? (
              <span>Authenticating with MongoDB...</span>
            ) : (
              <>
                <span>Sign in as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Credentials cheat-sheet for rapid testing */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--dust-border)',
            textAlign: 'left',
            fontSize: '0.75rem',
            color: 'var(--dust-dim)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#90EE90' }}>
            <CheckCircle2 size={15} color="#90EE90" />
            <span style={{ fontWeight: 600 }}>Default Accounts in MongoDB:</span>
          </div>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, lineHeight: 1.4, color: 'var(--dust-text)' }}>
            <li><strong style={{ color: '#FF6A00' }}>Maintainer:</strong> maintainer@college.edu / adminpassword</li>
            <li><strong style={{ color: '#BF5AF2' }}>Faculty:</strong> sarah.faculty@college.edu / faculty123</li>
            <li><strong style={{ color: '#00F5FF' }}>Student:</strong> alex.student@college.edu / student123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

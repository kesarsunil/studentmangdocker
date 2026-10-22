import React, { useState } from 'react';
import { Shield, BookOpen, UserCheck, KeyRound, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login({ onLoginSuccess, isMongoConnected }) {
  const [selectedRole, setSelectedRole] = useState('maintainer');
  const [email, setEmail] = useState('maintainer@college.edu');
  const [password, setPassword] = useState('adminpassword');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Role info & demo credentials
  const roleConfig = {
    maintainer: {
      title: 'Maintainer / Admin',
      subtitle: 'Create & manage faculty, students, and system credentials in MongoDB',
      icon: Shield,
      color: '#6366f1',
      demoEmail: 'maintainer@college.edu',
      demoPass: 'adminpassword',
      badge: 'Full Access',
    },
    faculty: {
      title: 'Faculty / Instructor',
      subtitle: 'Take student attendance, mark Present/Absent, and track history',
      icon: BookOpen,
      color: '#10b981',
      demoEmail: 'sarah.faculty@college.edu',
      demoPass: 'faculty123',
      badge: 'Attendance Marking',
    },
    student: {
      title: 'Student Portal',
      subtitle: 'View attendance percentage, subject logs, and compliance records',
      icon: UserCheck,
      color: '#06b6d4',
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please verify credentials.');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentRoleIcon = roleConfig[selectedRole].icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.8px', color: '#fff', marginBottom: 8 }}>
          Attendance System Portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>
          Select your portal role below to sign in. All accounts and attendance logs are securely stored in MongoDB Atlas.
        </p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: 480, padding: 32 }}>
        {/* Role Selection Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: 6,
            background: 'rgba(13, 18, 30, 0.9)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            border: '1px solid var(--border-color)',
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
                  background: isSelected ? `rgba(${key === 'maintainer' ? '99, 102, 241' : key === 'faculty' ? '16, 185, 129' : '6, 182, 212'}, 0.15)` : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  transition: 'all 0.2s ease',
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
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `rgba(${selectedRole === 'maintainer' ? '99, 102, 241' : selectedRole === 'faculty' ? '16, 185, 129' : '6, 182, 212'}, 0.2)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: roleConfig[selectedRole].color,
            }}
          >
            <CurrentRoleIcon size={20} />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {roleConfig[selectedRole].title}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fecdd3',
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
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
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
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
            </div>
          </div>

          {/* Quick Demo Fill Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{
                background: 'none',
                border: 'none',
                color: roleConfig[selectedRole].color,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={13} />
              Auto-fill Demo Credentials
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Role: <strong>{selectedRole}</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              background: `linear-gradient(135deg, ${roleConfig[selectedRole].color}, #4338ca)`,
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
            borderTop: '1px solid var(--border-color)',
            textAlign: 'left',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-muted)' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span style={{ fontWeight: 600 }}>Default Accounts in MongoDB:</span>
          </div>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.4 }}>
            <li><strong>Maintainer:</strong> maintainer@college.edu / adminpassword</li>
            <li><strong>Faculty:</strong> sarah.faculty@college.edu / faculty123</li>
            <li><strong>Student:</strong> alex.student@college.edu / student123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

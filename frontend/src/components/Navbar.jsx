import React from 'react';
import { GraduationCap, LogOut, Database, UserCheck, Shield, BookOpen } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, isMongoConnected }) {
  const getRoleIcon = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'maintainer':
        return <Shield size={16} className="text-indigo-400" />;
      case 'faculty':
        return <BookOpen size={16} className="text-emerald-400" />;
      case 'student':
        return <UserCheck size={16} className="text-cyan-400" />;
      default:
        return null;
    }
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="nav-brand-logo">
          <GraduationCap size={22} />
        </div>
        <div>
          <span>AttendSphere</span>
          <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.4px' }}>
            Smart Attendance Management
          </span>
        </div>
      </div>

      <div className="nav-actions">
        {/* MongoDB Connection Status Pill */}
        <div
          className="status-indicator"
          title="Direct connection to MongoDB Atlas"
          style={{
            background: isMongoConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            borderColor: isMongoConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            color: isMongoConnected ? '#34d399' : '#fbbf24',
          }}
        >
          <div
            className="status-dot animate-pulse-slow"
            style={{
              background: isMongoConnected ? '#10b981' : '#f59e0b',
              boxShadow: isMongoConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
            }}
          />
          <Database size={13} style={{ marginRight: 2 }} />
          <span>{isMongoConnected ? 'MongoDB Atlas Live' : 'Local Cache (Syncing)'}</span>
        </div>

        {currentUser && (
          <>
            <div className="user-profile-pill">
              {getRoleIcon()}
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {currentUser.email}
                </span>
              </div>
              <span className="badge badge-role" style={{ marginLeft: 6 }}>
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

import React from 'react';
import { GraduationCap, LogOut, Database, UserCheck, Shield, BookOpen } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, isMongoConnected }) {
  const getRoleIcon = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'maintainer':
        return <Shield size={16} style={{ color: '#FF6A00' }} />;
      case 'faculty':
        return <BookOpen size={16} style={{ color: '#BF5AF2' }} />;
      case 'student':
        return <UserCheck size={16} style={{ color: '#00F5FF' }} />;
      default:
        return null;
    }
  };

  const getRoleBadgeClass = () => {
    switch (currentUser?.role) {
      case 'maintainer':
        return 'badge badge-orange';
      case 'faculty':
        return 'badge badge-purple';
      case 'student':
        return 'badge badge-cyan';
      default:
        return 'badge badge-dust';
    }
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="nav-brand-logo">
          <GraduationCap size={22} />
        </div>
        <div>
          <span className="animated-gradient-text" style={{ fontSize: '1.3rem', fontWeight: 800 }}>AttendSphere</span>
          <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--dust-text)', fontWeight: 500, letterSpacing: '0.4px' }}>
            Smart Attendance Management
          </span>
        </div>
      </div>

      <div className="nav-actions">
        {/* MongoDB Connection Status Pill: Light Green (#90EE90) for Live */}
        <div
          className="status-indicator"
          title="Direct connection to MongoDB Atlas"
          style={{
            background: isMongoConnected ? 'rgba(144, 238, 144, 0.12)' : 'rgba(255, 184, 0, 0.12)',
            borderColor: isMongoConnected ? 'rgba(144, 238, 144, 0.35)' : 'rgba(255, 184, 0, 0.35)',
            color: isMongoConnected ? '#90EE90' : '#FFB800',
          }}
        >
          <div
            className="status-dot animate-pulse-slow"
            style={{
              background: isMongoConnected ? '#90EE90' : '#FFB800',
              boxShadow: isMongoConnected ? '0 0 10px #90EE90' : '0 0 10px #FFB800',
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
                <span style={{ fontSize: '0.72rem', color: 'var(--dust-text)' }}>
                  {currentUser.email}
                </span>
              </div>
              <span className={getRoleBadgeClass()} style={{ marginLeft: 6, textTransform: 'uppercase', fontSize: '0.7rem' }}>
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

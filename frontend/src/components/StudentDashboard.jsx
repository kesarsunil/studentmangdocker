import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export default function StudentDashboard({ currentUser, onNotify }) {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/summary?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setRecords(data.records);
      } else {
        throw new Error(data.message || 'Failed to fetch student attendance');
      }
    } catch (err) {
      console.error('Error fetching student summary:', err);
      onNotify('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [currentUser]);

  const percentage = summary?.overallPercentage || 0;
  const isGood = percentage >= 75;
  const isWarning = percentage >= 65 && percentage < 75;
  const statusColor = isGood ? '#10b981' : isWarning ? '#f59e0b' : '#f43f5e';

  return (
    <div className="animate-fade-in">
      {/* Student Profile Banner */}
      <div
        className="glass-panel"
        style={{
          padding: 24,
          marginBottom: 28,
          textAlign: 'left',
          background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.8), rgba(30, 41, 59, 0.7))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 20px rgba(6, 182, 212, 0.3)',
              }}
            >
              <GraduationCap size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                  {currentUser.name}
                </h2>
                <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  {currentUser.rollNo || 'Student'}
                </span>
                <span
                  className="badge"
                  style={{
                    background: currentUser.section === 'Section B' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: currentUser.section === 'Section B' ? '#c084fc' : '#38bdf8',
                    border: `1px solid ${currentUser.section === 'Section B' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                  }}
                >
                  {currentUser.section || 'Section A'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                {currentUser.department} • {currentUser.semester || 'Semester 4'} • {currentUser.email}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: isGood ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${isGood ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: statusColor,
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isGood ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{isGood ? 'Eligible for Exams (≥ 75%)' : isWarning ? 'Warning: Low Attendance' : 'Critical Attendance Shortage'}</span>
          </div>
        </div>
      </div>

      {/* KPI & Radial Attendance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
        {/* Attendance Percentage Card */}
        <div className="glass-panel" style={{ padding: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            Overall Attendance Rate
          </span>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: `6px solid ${statusColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: `0 0 20px ${statusColor}40`,
              marginBottom: 10,
            }}
          >
            {percentage}%
          </div>
          <span style={{ fontSize: '0.8rem', color: statusColor, fontWeight: 600 }}>
            {summary?.statusLevel || 'Good'} Standing
          </span>
        </div>

        {/* Total Classes */}
        <div className="glass-panel" style={{ padding: 22, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Lectures
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>
            {summary?.totalClasses || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Delivered to date</span>
        </div>

        {/* Present Count */}
        <div className="glass-panel" style={{ padding: 22, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Classes Attended
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399' }}>
            {summary?.present || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Present Days</span>
        </div>

        {/* Absent Count */}
        <div className="glass-panel" style={{ padding: 22, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Classes Missed
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fb7185' }}>
            {summary?.absent || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>Absent Days</span>
        </div>
      </div>

      {/* Subject Breakdown & Progress Bars */}
      <div className="glass-panel" style={{ padding: 24, textAlign: 'left', marginBottom: 28 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} color="#06b6d4" />
          <span>Subject-Wise Attendance Breakdown</span>
        </h3>

        {summary?.subjectBreakdown?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
            No subject records available yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {summary?.subjectBreakdown?.map((sub, i) => {
              const subPct = sub.percentage;
              const subColor = subPct >= 75 ? '#10b981' : subPct >= 65 ? '#f59e0b' : '#f43f5e';
              return (
                <div
                  key={i}
                  style={{
                    background: 'rgba(13, 18, 30, 0.85)',
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                      {sub.subject}
                    </span>
                    <span style={{ fontWeight: 800, color: subColor, fontSize: '0.9rem' }}>
                      {subPct}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div style={{ width: '100%', height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ width: `${subPct}%`, height: '100%', background: subColor, borderRadius: 9999, transition: 'width 0.4s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Attended: <strong>{sub.present}</strong> / {sub.total}</span>
                    <span>Missed: <strong style={{ color: '#fb7185' }}>{sub.absent}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance History Timeline Table */}
      <div className="glass-panel" style={{ padding: 24, textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSpreadsheet size={18} color="#10b981" />
          <span>My Attendance Log (Fetched from MongoDB Atlas)</span>
        </h3>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Section</th>
                <th>Instructor / Faculty</th>
                <th style={{ textAlign: 'center' }}>My Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                    No attendance logs recorded for your account yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8' }}>
                      📅 {r.date}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.subject}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        {r.section || 'Section A'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {r.facultyName}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${
                          r.status === 'Present'
                            ? 'badge-present'
                            : r.status === 'Absent'
                            ? 'badge-absent'
                            : 'badge-late'
                        }`}
                      >
                        {r.status === 'Present' ? (
                          <CheckCircle2 size={13} />
                        ) : r.status === 'Absent' ? (
                          <XCircle size={13} />
                        ) : (
                          <Clock size={13} />
                        )}
                        <span>{r.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

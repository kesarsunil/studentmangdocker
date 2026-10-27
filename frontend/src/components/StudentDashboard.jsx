import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  Send,
  PhoneCall,
  FileText,
  UserCheck,
  MessageSquare,
  Plus,
  RefreshCw,
  X,
  Camera,
  MapPin,
  Phone,
  Maximize2,
  Trash2,
} from 'lucide-react';

export default function StudentDashboard({ currentUser, onNotify }) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'antiragging'
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Photo Lightbox State
  const [lightboxData, setLightboxData] = useState(null);

  // Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    incidentType: 'Physical Harassment',
    severity: 'High',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '',
    location: '',
    studentPhone: '',
    accusedDetails: '',
    description: '',
    witnessDetails: '',
    proofImage: null,
  });

  const [proofPreview, setProofPreview] = useState(null);

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

  const loadComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await fetch(`/api/student/complaints?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching student complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    loadStudentData();
    loadComplaints();
  }, [currentUser]);

  // Smart auto-compression to ensure proof photo safely fits in network payload & database (<65KB Base64)
  const compressImageToSafeSize = (srcUrlOrDataUrl, targetMaxChars = 62000) => {
    return new Promise((resolve) => {
      if (!srcUrlOrDataUrl || typeof srcUrlOrDataUrl !== 'string') {
        return resolve(srcUrlOrDataUrl);
      }
      const img = new Image();
      img.onload = () => {
        let maxDim = 640;
        let quality = 0.65;

        const attemptCompress = (curMaxDim, curQuality) => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > curMaxDim || height > curMaxDim) {
            if (width > height) {
              height = Math.round((height * curMaxDim) / width);
              width = curMaxDim;
            } else {
              width = Math.round((width * curMaxDim) / height);
              height = curMaxDim;
            }
          }

          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', curQuality);

          if (dataUrl.length > targetMaxChars && curMaxDim > 300) {
            return attemptCompress(Math.round(curMaxDim * 0.8), Math.max(0.35, curQuality - 0.1));
          }
          return dataUrl;
        };

        resolve(attemptCompress(maxDim, quality));
      };
      img.onerror = () => resolve(srcUrlOrDataUrl);
      img.src = srcUrlOrDataUrl;
    });
  };

  // Handle Proof Photo file selection & client-side compression
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('error', 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      onNotify('error', 'Image file is too large (max 20MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const compressed = await compressImageToSafeSize(event.target.result, 62000);
        setComplaintForm((prev) => ({ ...prev, proofImage: compressed }));
        setProofPreview(compressed);
      } catch (err) {
        console.error('Image compression error:', err);
        setComplaintForm((prev) => ({ ...prev, proofImage: event.target.result }));
        setProofPreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setComplaintForm((prev) => ({ ...prev, proofImage: null }));
    setProofPreview(null);
  };

  // Handle complaint submission
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) {
      onNotify('error', 'Please provide a detailed description of the incident.');
      return;
    }
    if (!complaintForm.location.trim()) {
      onNotify('error', 'Please specify where the incident occurred.');
      return;
    }

    setSubmittingComplaint(true);
    try {
      let finalProofImage = complaintForm.proofImage;
      if (finalProofImage && finalProofImage.length > 65000) {
        try {
          finalProofImage = await compressImageToSafeSize(finalProofImage, 60000);
        } catch (cErr) {
          console.warn('Pre-submit compression warning:', cErr);
        }
      }

      const payload = {
        studentId: currentUser.id || currentUser._id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentRollNo: currentUser.rollNo || 'N/A',
        studentDepartment: currentUser.department || 'General',
        studentSection: currentUser.section || 'Section A',
        ...complaintForm,
        proofImage: finalProofImage,
      };

      const res = await fetch('/api/student/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        if (res.status === 413) {
          throw new Error('The proof photo is too large for the server. Please restart the backend server (Ctrl+C then node server.js) to activate the 25MB upload limit.');
        }
        throw new Error(`Server returned error (${res.status}): Please restart the backend server (Ctrl+C then node server.js) to load the updated complaint routes.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to record complaint in database.');
      }

      onNotify('success', 'Complaint and proof photo stored in MongoDB Atlas! The Admin & Anti-Ragging Committee have been alerted.');
      setShowComplaintModal(false);
      setComplaintForm({
        incidentType: 'Physical Harassment',
        severity: 'High',
        incidentDate: new Date().toISOString().split('T')[0],
        incidentTime: '',
        location: '',
        studentPhone: '',
        accusedDetails: '',
        description: '',
        witnessDetails: '',
        proofImage: null,
      });
      setProofPreview(null);
      await loadComplaints();
    } catch (err) {
      onNotify('error', err.message);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const percentage = summary?.overallPercentage || 0;
  const isGood = percentage >= 75;
  const isWarning = percentage >= 65 && percentage < 75;
  const statusColor = isGood ? '#10b981' : isWarning ? '#f59e0b' : '#f43f5e';

  // Severity color badge helper
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Urgent / Emergency':
        return { bg: 'rgba(244, 63, 94, 0.2)', border: '#f43f5e', color: '#fb7185' };
      case 'High':
        return { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', color: '#fdba74' };
      case 'Medium':
        return { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', color: '#fcd34d' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', color: '#6ee7b7' };
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', color: '#34d399', text: 'Resolved' };
      case 'Action Taken':
        return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', color: '#c084fc', text: 'Action Taken' };
      case 'Under Review':
        return { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8', text: 'Under Committee Review' };
      case 'Dismissed':
        return { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)', color: '#94a3b8', text: 'Dismissed' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', text: 'Pending Investigation' };
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Student Profile Banner */}
      <div
        className="glass-panel"
        style={{
          padding: 24,
          marginBottom: 20,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              <span>{isGood ? 'Eligible for Exams (≥ 75%)' : isWarning ? 'Warning: Low Attendance' : 'Attendance Shortage'}</span>
            </div>

            <button
              onClick={() => {
                setActiveTab('antiragging');
                setShowComplaintModal(true);
              }}
              className="btn btn-danger"
              style={{
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
                padding: '8px 16px',
              }}
            >
              <ShieldAlert size={16} />
              <span>Report Ragging</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Student Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)' }}
        >
          <BookOpen size={16} />
          <span>My Attendance & Academic Records</span>
        </button>

        <button
          onClick={() => setActiveTab('antiragging')}
          className={`btn ${activeTab === 'antiragging' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            background: activeTab === 'antiragging' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
          }}
        >
          <ShieldAlert size={16} />
          <span>Anti-Ragging & Safety Cell</span>
          {complaints.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: 'rgba(255,255,255,0.25)',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {complaints.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: ATTENDANCE OVERVIEW ================= */}
      {activeTab === 'attendance' && (
        <>
          {/* KPI & Radial Attendance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
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
        </>
      )}

      {/* ================= TAB 2: ANTI-RAGGING & HARASSMENT CELL ================= */}
      {activeTab === 'antiragging' && (
        <div className="animate-fade-in">
          {/* Emergency Alert & UGC Compliance Banner */}
          <div
            className="glass-panel"
            style={{
              padding: 24,
              marginBottom: 24,
              textAlign: 'left',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              background: 'linear-gradient(135deg, rgba(88, 28, 44, 0.45), rgba(18, 24, 38, 0.85))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fb7185',
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      Institutional Anti-Ragging & Safety Cell
                    </h3>
                    <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
                      Zero Tolerance Policy
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6, lineHeight: 1.5, maxWidth: 780 }}>
                    Our institution enforces a strict Zero Tolerance Policy against any form of ragging, physical intimidation, psychological bullying, or verbal harassment. All complaints, including time, location, contact phone, and proof photos, are stored directly in MongoDB Atlas and immediately accessible to the Administration.
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: '#fca5a5' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PhoneCall size={14} /> National 24x7 Helpline: <strong>1800-180-5522</strong> (Toll Free)
                    </span>
                    <span>•</span>
                    <span>Campus Proctorial Office: <strong>+91 98765 43210</strong></span>
                    <span>•</span>
                    <span>Email: <strong>antiragging@college.edu</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowComplaintModal(true)}
                className="btn btn-danger"
                style={{
                  padding: '12px 24px',
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  boxShadow: '0 6px 20px rgba(244, 63, 94, 0.4)',
                }}
              >
                <Plus size={18} />
                <span>Lodge Ragging Complaint</span>
              </button>
            </div>
          </div>

          {/* Submitted Complaints Section */}
          <div className="glass-panel" style={{ padding: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#f43f5e" />
                  <span>My Ragging Complaints Log ({complaints.length})</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  Stored in MongoDB Atlas • Monitored live by College Administration
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={loadComplaints}
                  className="btn btn-secondary btn-sm"
                  title="Refresh from MongoDB"
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}
                >
                  <Plus size={14} />
                  <span>New Complaint</span>
                </button>
              </div>
            </div>

            {loadingComplaints ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Fetching your complaints from MongoDB Atlas...
              </div>
            ) : complaints.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  background: 'rgba(13, 18, 30, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    margin: '0 auto 16px',
                  }}
                >
                  <ShieldCheck size={32} />
                </div>
                <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>No Complaints Recorded</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6, maxWidth: 450, marginInline: 'auto' }}>
                  You have not submitted any ragging or harassment complaints. If you experience or witness any misconduct, you can safely submit an incident report with proof photos.
                </p>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="btn btn-secondary"
                  style={{ marginTop: 18 }}
                >
                  <Plus size={15} />
                  <span>Submit an Incident Report</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {complaints.map((c) => {
                  const sev = getSeverityBadge(c.severity);
                  const st = getStatusBadge(c.status);

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'rgba(13, 18, 30, 0.85)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: 20,
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                              {c.incidentType}
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: sev.bg,
                                border: `1px solid ${sev.border}`,
                                color: sev.color,
                                fontSize: '0.75rem',
                              }}
                            >
                              Severity: {c.severity}
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: st.bg,
                                border: `1px solid ${st.border}`,
                                color: st.color,
                                fontWeight: 700,
                              }}
                            >
                              {st.text}
                            </span>
                          </div>

                          {/* Where, When (Date & Time), and Contact Phone */}
                          <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '0.825rem', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={14} color="#38bdf8" />
                              <span>Time: <strong style={{ color: '#fff' }}>{c.incidentDate}{c.incidentTime ? ` at ${c.incidentTime}` : ''}</strong></span>
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={14} color="#f43f5e" />
                              <span>Where: <strong style={{ color: '#fff' }}>{c.location || 'Campus'}</strong></span>
                            </span>
                            {c.studentPhone && (
                              <>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Phone size={14} color="#10b981" />
                                  <span>Phone: <strong style={{ color: '#34d399' }}>{c.studentPhone}</strong></span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>
                          ID: {c.id?.substring(0, 10)}...
                        </span>
                      </div>

                      {/* Accused & Details Box */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '14px 16px',
                          borderRadius: 8,
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                          <strong>Accused / Perpetrator(s):</strong>{' '}
                          <span style={{ color: '#fca5a5' }}>{c.accusedDetails || 'Not specified'}</span>
                        </div>
                        {c.witnessDetails && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            <strong>Witnesses:</strong> {c.witnessDetails}
                          </div>
                        )}
                        <p style={{ color: '#e2e8f0', fontSize: '0.875rem', marginTop: 8, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {c.description}
                        </p>

                        {/* Proof Photo thumbnail */}
                        {c.proofImage && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Camera size={14} color="#38bdf8" />
                              <span>Attached Proof Photo (Click to Enlarge):</span>
                            </div>
                            <div
                              onClick={() => setLightboxData({
                                url: c.proofImage,
                                title: `${c.incidentType} - Proof Photo`,
                                subtitle: `Location: ${c.location} • Time: ${c.incidentDate} ${c.incidentTime || ''}`,
                              })}
                              style={{
                                display: 'inline-flex',
                                position: 'relative',
                                cursor: 'pointer',
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                              }}
                              title="Click to view full photo"
                            >
                              <img
                                src={c.proofImage}
                                alt="Incident Proof"
                                style={{ width: 140, height: 90, objectFit: 'cover', display: 'block' }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  opacity: 0.85,
                                  transition: 'opacity 0.2s',
                                }}
                              >
                                <Maximize2 size={18} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Official Admin / Committee Notes */}
                      {c.adminNotes ? (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#e0f2fe',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
                            <MessageSquare size={15} />
                            <span>Anti-Ragging Committee & Admin Remarks:</span>
                          </div>
                          <p style={{ margin: 0, lineHeight: 1.5 }}>{c.adminNotes}</p>
                          {c.updatedAt && (
                            <span style={{ display: 'block', marginTop: 6, fontSize: '0.725rem', color: '#93c5fd' }}>
                              Status updated: {new Date(c.updatedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          ⏳ Awaiting investigation update by Institutional Committee. You will see official remarks here once reviewed.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: SUBMIT RAGGING COMPLAINT ================= */}
      {showComplaintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(244, 63, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fb7185',
                  }}
                >
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>
                    Anti-Ragging Incident Complaint
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                    Report & proof photo will be recorded in MongoDB Atlas & reviewed by Admin
                  </p>
                </div>
              </div>
              <button onClick={() => setShowComplaintModal(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            {/* Verified Complainant Details (Automatic) */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>
                <UserCheck size={14} />
                <span>Complainant Student Identity (Recorded Automatically in MongoDB):</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.825rem', color: '#fff' }}>
                <span><strong>Name:</strong> {currentUser.name}</span>
                <span>•</span>
                <span><strong>Roll No:</strong> {currentUser.rollNo || 'N/A'}</span>
                <span>•</span>
                <span><strong>Section:</strong> {currentUser.section || 'Section A'}</span>
                <span>•</span>
                <span><strong>Dept:</strong> {currentUser.department}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Email: {currentUser.email}
              </div>
            </div>

            <form onSubmit={handleSubmitComplaint}>
              {/* Phone Number Field */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#38bdf8' }}>
                  Student Contact Phone / Mobile Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210 (Active mobile/WhatsApp number)"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    value={complaintForm.studentPhone}
                    onChange={(e) => setComplaintForm({ ...complaintForm, studentPhone: e.target.value })}
                  />
                  <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#38bdf8' }} />
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                  The Anti-Ragging Committee will use this phone number for urgent verification and immediate assistance.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Incident Type */}
                <div className="form-group">
                  <label className="form-label">Incident Classification *</label>
                  <select
                    className="form-select"
                    value={complaintForm.incidentType}
                    onChange={(e) => setComplaintForm({ ...complaintForm, incidentType: e.target.value })}
                  >
                    <option value="Physical Harassment">Physical Harassment / Violence</option>
                    <option value="Verbal Abuse & Humiliation">Verbal Abuse & Humiliation</option>
                    <option value="Hostel Ragging & Confinement">Hostel Ragging & Confinement</option>
                    <option value="Extortion / Forced Payment">Extortion / Forced Payment</option>
                    <option value="Psychological Bullying">Psychological Bullying / Threats</option>
                    <option value="Cyber / Online Harassment">Cyber / Online Harassment</option>
                    <option value="Forced Menial Labor / Tasks">Forced Menial Labor / Tasks</option>
                    <option value="Other Harassment">Other Harassment</option>
                  </select>
                </div>

                {/* Severity */}
                <div className="form-group">
                  <label className="form-label">Severity Level *</label>
                  <select
                    className="form-select"
                    value={complaintForm.severity}
                    onChange={(e) => setComplaintForm({ ...complaintForm, severity: e.target.value })}
                    style={{
                      borderColor: complaintForm.severity === 'Urgent / Emergency' ? '#f43f5e' : undefined,
                      color: complaintForm.severity === 'Urgent / Emergency' ? '#fb7185' : undefined,
                    }}
                  >
                    <option value="Urgent / Emergency">🔴 Urgent / Emergency (Immediate Danger)</option>
                    <option value="High">🟠 High (Repeated / Aggressive)</option>
                    <option value="Medium">🟡 Medium (Intimidation / Distress)</option>
                    <option value="Low">🟢 Low (First occurrence / Minor)</option>
                  </select>
                </div>
              </div>

              {/* Where and Which Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Date */}
                <div className="form-group">
                  <label className="form-label">Date of Incident *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={complaintForm.incidentDate}
                    onChange={(e) => setComplaintForm({ ...complaintForm, incidentDate: e.target.value })}
                  />
                </div>

                {/* Which Time */}
                <div className="form-group">
                  <label className="form-label" style={{ color: '#fb7185' }}>
                    Incident Time (Which Time) *
                  </label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={complaintForm.incidentTime}
                    onChange={(e) => setComplaintForm({ ...complaintForm, incidentTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Where (Location / Venue) */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#fb7185' }}>
                  Exact Location / Venue (Where it happened) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hostel Block B - Room 304, Near Canteen backside, Chemistry Lab 2..."
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    value={complaintForm.location}
                    onChange={(e) => setComplaintForm({ ...complaintForm, location: e.target.value })}
                  />
                  <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#f43f5e' }} />
                </div>
              </div>

              {/* Proof Photo Upload */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#38bdf8' }}>
                  Proof Photo / Evidence Image (Stored in MongoDB)
                </label>

                {!proofPreview ? (
                  <div
                    style={{
                      border: '2px dashed var(--border-hover)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px',
                      textAlign: 'center',
                      background: 'rgba(13, 18, 30, 0.5)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onClick={() => document.getElementById('proofFileInput')?.click()}
                  >
                    <input
                      id="proofFileInput"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: 'rgba(6, 182, 212, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#38bdf8',
                        }}
                      >
                        <Camera size={20} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
                        Click to Upload Proof Photo
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Attach photos of injury, damaged belongings, location, or screenshots (JPG, PNG)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      background: 'rgba(13, 18, 30, 0.8)',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    <img
                      src={proofPreview}
                      alt="Proof Preview"
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }}
                    />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', display: 'block' }}>
                        ✓ Proof Photo Ready to Store in MongoDB
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Optimized and prepared for admin review
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accused Persons */}
              <div className="form-group">
                <label className="form-label">Alleged Perpetrator(s) / Accused Students *</label>
                <input
                  type="text"
                  required
                  placeholder="Names, batch, hostel room numbers, or physical descriptions"
                  className="form-input"
                  value={complaintForm.accusedDetails}
                  onChange={(e) => setComplaintForm({ ...complaintForm, accusedDetails: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Detailed Incident Narrative *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe in detail what happened, what was said or forced, any injuries or threats made..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                />
              </div>

              {/* Witnesses */}
              <div className="form-group">
                <label className="form-label">Witnesses (Optional)</label>
                <input
                  type="text"
                  placeholder="Names or contacts of students/faculty who witnessed the incident"
                  className="form-input"
                  value={complaintForm.witnessDetails}
                  onChange={(e) => setComplaintForm({ ...complaintForm, witnessDetails: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBlock: 16 }}>
                <input type="checkbox" id="affirmTruth" required style={{ width: 16, height: 16, accentColor: '#f43f5e', cursor: 'pointer' }} />
                <label htmlFor="affirmTruth" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  I confirm that this report is true and accurately describes the harassment / ragging incident.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="btn btn-danger"
                  style={{
                    background: 'linear-gradient(135deg, #f43f5e, #be123c)',
                    boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)',
                  }}
                >
                  {submittingComplaint ? (
                    <span>Submitting to MongoDB...</span>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Official Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX MODAL: FULL PROOF PHOTO VIEW ================= */}
      {lightboxData && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxData(null)}
        >
          {/* Top Right 'X' Close Button */}
          <button
            onClick={() => setLightboxData(null)}
            className="lightbox-close-btn"
            title="Close Proof Photo (Esc)"
          >
            <X size={24} />
          </button>

          <div
            className="lightbox-image-container"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxData.url}
              alt={lightboxData.title}
              className="lightbox-image"
            />
          </div>

          <div
            className="lightbox-caption"
            onClick={(e) => e.stopPropagation()}
          >
            <Camera size={16} color="#38bdf8" />
            <strong style={{ color: '#fff' }}>{lightboxData.title}</strong>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{lightboxData.subtitle}</span>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Filter,
  CheckCheck,
  History,
  FileCheck,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export default function FacultyDashboard({ currentUser, onNotify }) {
  const [activeTab, setActiveTab] = useState('take'); // 'take' | 'history'
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'Present' | 'Absent' | 'Late' }
  const [selectedSubject, setSelectedSubject] = useState(
    currentUser.subjects?.[0] || 'Data Structures'
  );
  const [selectedSection, setSelectedSection] = useState('All'); // 'All' | 'Section A' | 'Section B' | etc.
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDept, setSelectedDept] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // History state
  const [historySessions, setHistorySessions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilterSubject, setHistoryFilterSubject] = useState('All');
  const [historyFilterSection, setHistoryFilterSection] = useState('All');
  const [historyFilterDate, setHistoryFilterDate] = useState('');
  const [expandedSessions, setExpandedSessions] = useState({}); // { [sessionId]: true/false }

  // Load students for taking attendance
  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (selectedSection !== 'All') params.append('section', selectedSection);

      const res = await fetch(`/api/faculty/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        // Default everyone to 'Present' initially
        const initialMap = {};
        data.students.forEach((s) => {
          initialMap[s.id] = 'Present';
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      onNotify('error', 'Failed to load students: ' + err.message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Load attendance history from MongoDB
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (historyFilterSubject !== 'All') params.append('subject', historyFilterSubject);
      if (historyFilterSection !== 'All') params.append('section', historyFilterSection);
      if (historyFilterDate) params.append('date', historyFilterDate);

      const res = await fetch(`/api/faculty/attendance-history?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setHistorySessions(data.sessions);
        // Expand the first 3 sessions by default so history is immediately visible
        const expanded = {};
        data.sessions.slice(0, 3).forEach((s) => {
          expanded[s.id] = true;
        });
        setExpandedSessions(expanded);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      onNotify('error', 'Failed to load history: ' + err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'take') {
      loadStudents();
    } else {
      loadHistory();
    }
  }, [selectedDept, selectedSection, activeTab, historyFilterSubject, historyFilterSection, historyFilterDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // Submit attendance to MongoDB
  const handleSubmitAttendance = async () => {
    if (students.length === 0) {
      onNotify('error', 'No students found in the selected section/department.');
      return;
    }

    setIsSubmitting(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        rollNo: s.rollNo,
        name: s.name,
        email: s.email,
        department: s.department,
        section: s.section || selectedSection !== 'All' ? selectedSection : 'Section A',
        status: attendanceMap[s.id] || 'Present',
      }));

      const payload = {
        date: selectedDate,
        subject: selectedSubject,
        section: selectedSection !== 'All' ? selectedSection : 'Section A',
        facultyId: currentUser.id,
        facultyName: currentUser.name,
        facultyEmail: currentUser.email,
        records,
      };

      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit attendance.');
      }

      onNotify(
        'success',
        `Attendance for ${records.length} students (${payload.section}) saved to MongoDB Atlas!`
      );

      // Pre-load history so it's ready when user switches tabs
      await loadHistory();
    } catch (err) {
      onNotify('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete attendance session
  const handleDeleteSession = async (session) => {
    if (!window.confirm(`Delete attendance record for ${session.subject} (${session.section}) on ${session.date}?`)) return;
    try {
      const res = await fetch('/api/faculty/attendance-session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: session.date,
          subject: session.subject,
          section: session.section,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify('info', `Attendance session removed from MongoDB.`);
        await loadHistory();
      }
    } catch (err) {
      onNotify('error', err.message);
    }
  };

  // Counts
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'Late').length;

  return (
    <div className="animate-fade-in">
      {/* Top Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Faculty Attendance Suite
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Welcome, <strong>{currentUser.name}</strong> • Department of {currentUser.department}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, background: '#101010', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--dust-border)' }}>
          <button
            onClick={() => setActiveTab('take')}
            className={`btn btn-sm ${activeTab === 'take' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 18px' }}
          >
            <CheckCheck size={16} />
            <span>Take Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 18px',
              background: activeTab === 'history' ? 'linear-gradient(135deg, #BF5AF2, #9a3cd0)' : undefined,
              boxShadow: activeTab === 'history' ? '0 4px 16px rgba(191, 90, 242, 0.45)' : undefined,
            }}
          >
            <History size={16} />
            <span>Attendance History ({historySessions.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'take' && (
        <>
          {/* Controls Bar: Subject, Section, Date, Department Filter */}
          <div className="glass-panel" style={{ padding: 22, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subject / Course</label>
                <select
                  className="form-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {currentUser.subjects && currentUser.subjects.length > 0 ? (
                    currentUser.subjects.map((sub, i) => (
                      <option key={i} value={sub}>{sub}</option>
                    ))
                  ) : (
                    <>
                      <option value="Data Structures">Data Structures</option>
                      <option value="Database Systems">Database Systems</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Algorithms">Algorithms</option>
                    </>
                  )}
                </select>
              </div>

              {/* Section Selector */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Layers size={13} />
                  <span>Student Section</span>
                </label>
                <select
                  className="form-select"
                  style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="All">All Sections</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Attendance Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              {/* Bulk Quick Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => markAll('Present')}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, borderColor: '#90EE90', color: '#90EE90' }}
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('Absent')}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, borderColor: '#FF3B30', color: '#FF3B30' }}
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="badge badge-present" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Present: <strong>{presentCount}</strong></span>
            </div>
            <div className="badge badge-absent" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <XCircle size={16} />
              <span>Absent: <strong>{absentCount}</strong></span>
            </div>
            <div className="badge badge-late" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Clock size={16} />
              <span>Late: <strong>{lateCount}</strong></span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                Filter: {selectedSection}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Students in List: <strong style={{ color: '#fff', marginLeft: 4 }}>{students.length}</strong>
              </span>
            </div>
          </div>

          {/* Student Attendance Sheet Table */}
          <div className="glass-panel" style={{ padding: 20, textAlign: 'left', marginBottom: 24 }}>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Email Address</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Mark Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingStudents ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                        Loading students from MongoDB Atlas...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                        No students found for {selectedSection} in {selectedDept}. Select "All Sections" or ask the Maintainer to add students.
                      </td>
                    </tr>
                  ) : (
                    students.map((stud) => {
                      const currentStatus = attendanceMap[stud.id] || 'Present';
                      return (
                        <tr key={stud.id}>
                          <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            {stud.rollNo}
                          </td>
                          <td style={{ fontWeight: 600 }}>{stud.name}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: stud.section === 'Section B' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                color: stud.section === 'Section B' ? '#c084fc' : '#38bdf8',
                                border: `1px solid ${stud.section === 'Section B' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                              }}
                            >
                              {stud.section || 'Section A'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                            {stud.email}
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                              {stud.department}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, background: 'rgba(13, 18, 30, 0.9)', padding: 4, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stud.id, 'Present')}
                                style={{
                                  padding: '5px 14px',
                                  fontSize: '0.775rem',
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentStatus === 'Present' ? '#90EE90' : 'transparent',
                                  color: currentStatus === 'Present' ? '#080808' : 'var(--dust-text)',
                                  boxShadow: currentStatus === 'Present' ? '0 0 12px rgba(144, 238, 144, 0.45)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stud.id, 'Absent')}
                                style={{
                                  padding: '5px 14px',
                                  fontSize: '0.775rem',
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentStatus === 'Absent' ? '#FF3B30' : 'transparent',
                                  color: currentStatus === 'Absent' ? '#fff' : 'var(--dust-text)',
                                  boxShadow: currentStatus === 'Absent' ? '0 0 12px rgba(255, 59, 48, 0.45)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(stud.id, 'Late')}
                                style={{
                                  padding: '5px 14px',
                                  fontSize: '0.775rem',
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentStatus === 'Late' ? '#FFB800' : 'transparent',
                                  color: currentStatus === 'Late' ? '#080808' : 'var(--dust-text)',
                                  boxShadow: currentStatus === 'Late' ? '0 0 12px rgba(255, 184, 0, 0.45)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Submit Button Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Marking for: <strong style={{ color: '#fff' }}>{selectedSubject}</strong> • Section: <strong style={{ color: '#00F5FF' }}>{selectedSection}</strong> • Date: <strong style={{ color: '#fff' }}>{selectedDate}</strong>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="btn btn-secondary"
                >
                  <History size={16} />
                  <span>View in Attendance History &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting || students.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                >
                  <Save size={18} />
                  <span>{isSubmitting ? 'Saving to MongoDB...' : 'Save Attendance to MongoDB Atlas'}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ padding: 24, textAlign: 'left' }}>
          {/* Header & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Past Attendance Sessions Log
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
                Records stored in MongoDB Atlas, grouped by Date, Subject, and Section.
              </p>
            </div>

            <button
              onClick={loadHistory}
              className="btn btn-secondary btn-sm"
              title="Refresh from MongoDB"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 16, background: 'rgba(13, 18, 30, 0.7)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                Filter Subject
              </label>
              <select
                className="form-select"
                style={{ paddingBlock: 6, fontSize: '0.85rem' }}
                value={historyFilterSubject}
                onChange={(e) => setHistoryFilterSubject(e.target.value)}
              >
                <option value="All">All Subjects</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Database Systems">Database Systems</option>
                <option value="Web Development">Web Development</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="Algorithms">Algorithms</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                Filter Section
              </label>
              <select
                className="form-select"
                style={{ paddingBlock: 6, fontSize: '0.85rem' }}
                value={historyFilterSection}
                onChange={(e) => setHistoryFilterSection(e.target.value)}
              >
                <option value="All">All Sections</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
                <option value="Section D">Section D</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                Filter Date
              </label>
              <input
                type="date"
                className="form-input"
                style={{ paddingBlock: 6, fontSize: '0.85rem' }}
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
              />
            </div>

            {historyFilterDate && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setHistoryFilterDate('')}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', paddingBlock: 8 }}
                >
                  Clear Date
                </button>
              </div>
            )}
          </div>

          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
              Loading attendance history from MongoDB Atlas...
            </div>
          ) : historySessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <BookOpen size={36} color="var(--text-dim)" style={{ marginBottom: 12, display: 'inline-block' }} />
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 6 }}>No Attendance Sessions Found</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 440, margin: '0 auto 18px' }}>
                No records matched the current filters. Switch back to "Take Attendance" to mark attendance for your class.
              </p>
              <button
                onClick={() => setActiveTab('take')}
                className="btn btn-primary btn-sm"
              >
                Take Attendance Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {historySessions.map((session) => {
                const isExpanded = !!expandedSessions[session.id];
                return (
                  <div
                    key={session.id}
                    style={{
                      background: 'rgba(13, 18, 30, 0.85)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Session Header Card */}
                    <div
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      }}
                      onClick={() => toggleSessionExpand(session.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                          }}
                        >
                          <FileCheck size={20} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                              {session.subject}
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: session.section === 'Section B' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                color: session.section === 'Section B' ? '#c084fc' : '#38bdf8',
                                border: `1px solid ${session.section === 'Section B' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                              }}
                            >
                              {session.section || 'Section A'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            📅 <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{session.date}</span> • Marked by {session.facultyName}
                          </div>
                        </div>
                      </div>

                      {/* Stat Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="badge badge-present">{session.present} Present</span>
                        <span className="badge badge-absent">{session.absent} Absent</span>
                        {session.late > 0 && <span className="badge badge-late">{session.late} Late</span>}
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>
                          Rate: {session.percentage}%
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 8px', color: '#fb7185', borderColor: 'rgba(244,63,94,0.3)' }}
                            title="Delete this session from MongoDB"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div style={{ color: 'var(--text-dim)', padding: 4 }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Full Student Table for This Session */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px', background: 'rgba(8, 11, 20, 0.7)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
                          Students Attendance List ({session.records.length} Students)
                        </div>

                        <div className="data-table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Roll No</th>
                                <th>Student Name</th>
                                <th>Section</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th style={{ textAlign: 'center' }}>Attendance Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.records.map((r, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                                    {r.rollNo}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                                  <td>
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                                      {r.section || session.section}
                                    </span>
                                  </td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                    {r.studentEmail}
                                  </td>
                                  <td>
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                      {r.department}
                                    </span>
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

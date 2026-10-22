import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  PlusCircle,
  Trash2,
  Database,
  Search,
  BookOpen,
  KeyRound,
  Mail,
  Building,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

export default function MaintainerDashboard({ currentUser, onNotify }) {
  const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' | 'students' | 'mongodb'
  const [stats, setStats] = useState({ totalFaculty: 0, totalStudents: 0, totalAttendanceRecords: 0 });
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [mongoData, setMongoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Modals state
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Form states
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science',
    subjects: 'Data Structures, Database Systems',
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    section: 'Section A',
    department: 'Computer Science',
    semester: 'Semester 4',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch stats and lists
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, facultyRes, studentRes, debugRes] = await Promise.all([
        fetch('/api/maintainer/stats'),
        fetch('/api/maintainer/faculty'),
        fetch('/api/maintainer/students'),
        fetch('/api/debug/overview'),
      ]);

      const [statsData, facultyData, studentData, debugData] = await Promise.all([
        statsRes.json(),
        facultyRes.json(),
        studentRes.json(),
        debugRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (facultyData.success) setFacultyList(facultyData.faculty);
      if (studentData.success) setStudentList(studentData.students);
      if (debugData.success) setMongoData(debugData);
    } catch (err) {
      console.error('Error loading maintainer data:', err);
      onNotify('error', 'Could not refresh data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Faculty
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/maintainer/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add faculty');
      }

      onNotify('success', `Faculty "${facultyForm.name}" created and stored in MongoDB Atlas!`);
      setShowAddFacultyModal(false);
      setFacultyForm({
        name: '',
        email: '',
        password: '',
        department: 'Computer Science',
        subjects: 'Data Structures, Database Systems',
      });
      await loadData();
    } catch (err) {
      onNotify('error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Add Student (With Section)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/maintainer/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add student');
      }

      onNotify('success', `Student "${studentForm.name}" (${studentForm.section}) added and stored in MongoDB Atlas!`);
      setShowAddStudentModal(false);
      setStudentForm({
        name: '',
        email: '',
        password: '',
        rollNo: '',
        section: 'Section A',
        department: 'Computer Science',
        semester: 'Semester 4',
      });
      await loadData();
    } catch (err) {
      onNotify('error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Faculty
  const handleDeleteFaculty = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove faculty "${name}" from MongoDB?`)) return;
    try {
      const res = await fetch(`/api/maintainer/faculty/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete');
      onNotify('info', `Faculty "${name}" removed from MongoDB.`);
      await loadData();
    } catch (err) {
      onNotify('error', err.message);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}" from MongoDB?`)) return;
    try {
      const res = await fetch(`/api/maintainer/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete');
      onNotify('info', `Student "${name}" removed from MongoDB.`);
      await loadData();
    } catch (err) {
      onNotify('error', err.message);
    }
  };

  // Filtered lists
  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = studentList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = sectionFilter === 'All' || s.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  return (
    <div className="animate-fade-in">
      {/* Top Welcome & Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Maintainer Control Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Create faculty & student credentials, assign sections, and manage MongoDB Atlas database storage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAddFacultyModal(true)}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <PlusCircle size={16} />
            <span>Add New Faculty</span>
          </button>
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <PlusCircle size={16} />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 28 }}>
        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Faculty
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.totalFaculty}</div>
          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Active Instructors in MongoDB</span>
        </div>

        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Students
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.totalStudents}</div>
          <span style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Section A, B, C Enrolled</span>
        </div>

        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Attendance Records
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.totalAttendanceRecords}</div>
          <span style={{ fontSize: '0.75rem', color: '#67e8f9' }}>Attendance entries logged</span>
        </div>

        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Database Status
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
            MongoDB Atlas Live
          </div>
          <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            Connected & Syncing
          </span>
        </div>
      </div>

      {/* Main Tab Navigation & Search Bar */}
      <div className="glass-panel" style={{ padding: 24, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(13, 18, 30, 0.8)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`btn btn-sm ${activeTab === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px' }}
            >
              <BookOpen size={15} />
              <span>Faculty Directory ({facultyList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`btn btn-sm ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px' }}
            >
              <Users size={15} />
              <span>Student Directory ({studentList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('mongodb')}
              className={`btn btn-sm ${activeTab === 'mongodb' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px' }}
            >
              <Database size={15} />
              <span>MongoDB Records Live View</span>
            </button>
          </div>

          {/* Search & Section Filter */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {activeTab === 'students' && (
              <select
                className="form-select"
                style={{ width: 150, paddingBlock: 8, fontSize: '0.85rem' }}
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="All">All Sections</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
              </select>
            )}

            {activeTab !== 'mongodb' && (
              <div style={{ position: 'relative', width: 240 }}>
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  className="form-input"
                  style={{ paddingLeft: 36, paddingBlock: 8, fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Faculty List */}
        {activeTab === 'faculty' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Email (Login)</th>
                  <th>Password</th>
                  <th>Department</th>
                  <th>Assigned Subjects</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                      No faculty members found. Click "+ Add New Faculty" above to add one to MongoDB.
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                            {f.name.charAt(0)}
                          </div>
                          <span>{f.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                        {f.email}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: '#a5b4fc' }}>
                        {f.password}
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                          {f.department}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {Array.isArray(f.subjects) ? f.subjects.join(', ') : f.subjects}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteFaculty(f.id, f.name)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.25)', padding: '5px 10px' }}
                          title="Delete from MongoDB"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Students List (With Section) */}
        {activeTab === 'students' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Section</th>
                  <th>Email (Login)</th>
                  <th>Password</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                      No students found. Click "+ Add New Student" above to add one to MongoDB.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                        {s.rollNo}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.section === 'Section B' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: s.section === 'Section B' ? '#c084fc' : '#38bdf8',
                            border: `1px solid ${s.section === 'Section B' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                          }}
                        >
                          {s.section || 'Section A'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                        {s.email}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: '#a5b4fc' }}>
                        {s.password}
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                          {s.department}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {s.semester}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.25)', padding: '5px 10px' }}
                          title="Delete from MongoDB"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Live MongoDB Inspector */}
        {activeTab === 'mongodb' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: 20 }}>
              <CheckCircle2 size={18} color="#10b981" />
              <div style={{ fontSize: '0.85rem', color: '#d1fae5' }}>
                All user accounts created below are verified in your <strong>MongoDB Atlas Cluster0 ({mongoData?.databaseName || 'myDatabase'})</strong>.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(13, 18, 30, 0.95)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Database size={16} color="#6366f1" />
                  <span>Emails & Accounts in MongoDB "users"</span>
                </h4>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {mongoData?.mongoStats?.usersInMongoDB?.map((u, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                        {u.section && (
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#38bdf8' }}>
                            ({u.section})
                          </span>
                        )}
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                      </div>
                      <span className="badge badge-role">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(13, 18, 30, 0.95)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet size={16} color="#10b981" />
                  <span>MongoDB "attendance" Collection</span>
                </h4>
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
                    {mongoData?.mongoStats?.totalAttendanceInMongoDB || 0}
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Total attendance logs stored in MongoDB
                  </p>
                  <div style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Collection: <code>myDatabase.attendance</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD FACULTY ================= */}
      {showAddFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <BookOpen size={18} />
                </div>
                <h3 className="modal-title">Create Faculty Credentials</h3>
              </div>
              <button onClick={() => setShowAddFacultyModal(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFaculty}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Vance"
                  className="form-input"
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Login Username)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. robert.faculty@college.edu"
                  className="form-input"
                  value={facultyForm.email}
                  onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. facultyPass2026"
                  className="form-input"
                  value={facultyForm.password}
                  onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={facultyForm.department}
                  onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Subjects (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures, Web Development"
                  className="form-input"
                  value={facultyForm.subjects}
                  onChange={(e) => setFacultyForm({ ...facultyForm, subjects: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {formSubmitting ? 'Saving to MongoDB...' : 'Save Faculty in MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STUDENT ================= */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <Users size={18} />
                </div>
                <h3 className="modal-title">Create Student Credentials</h3>
              </div>
              <button onClick={() => setShowAddStudentModal(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-2026-042"
                    className="form-input"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  />
                </div>

                {/* Section Field */}
                <div className="form-group">
                  <label className="form-label" style={{ color: '#38bdf8' }}>Section</label>
                  <select
                    className="form-select"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Davis"
                  className="form-input"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Login Username)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jessica.student@college.edu"
                  className="form-input"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. studentPass123"
                  className="form-input"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    className="form-select"
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                >
                  {formSubmitting ? 'Saving to MongoDB...' : 'Save Student in MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

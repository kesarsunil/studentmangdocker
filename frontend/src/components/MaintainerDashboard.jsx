import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Trash2,
  Database,
  Search,
  BookOpen,
  X,
  FileSpreadsheet,
  ShieldAlert,
  Eye,
  UserCheck,
  RefreshCw,
  Camera,
  MapPin,
  Clock,
  Phone,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';

export default function MaintainerDashboard({ currentUser: _currentUser, onNotify }) {
  const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' | 'students' | 'complaints' | 'mongodb'
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalStudents: 0,
    totalAttendanceRecords: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
  });
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [complaintList, setComplaintList] = useState([]);
  const [mongoData, setMongoData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All');
  const [complaintSeverityFilter, setComplaintSeverityFilter] = useState('All');

  // Modals state
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Dedicated Proof Photo Lightbox Modal State
  const [previewPhoto, setPreviewPhoto] = useState(null);

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

  // Complaint action form
  const [actionForm, setActionForm] = useState({
    status: 'Under Review',
    adminNotes: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch stats and lists from MongoDB Atlas
  const loadData = async () => {
    try {
      const [statsRes, facultyRes, studentRes, complaintsRes, debugRes] = await Promise.all([
        fetch('/api/maintainer/stats'),
        fetch('/api/maintainer/faculty'),
        fetch('/api/maintainer/students'),
        fetch('/api/maintainer/complaints'),
        fetch('/api/debug/overview'),
      ]);

      const safeJson = async (r) => {
        try {
          const text = await r.text();
          return JSON.parse(text);
        } catch {
          return { success: false };
        }
      };

      const [statsData, facultyData, studentData, complaintsData, debugData] = await Promise.all([
        safeJson(statsRes),
        safeJson(facultyRes),
        safeJson(studentRes),
        safeJson(complaintsRes),
        safeJson(debugRes),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (facultyData.success) setFacultyList(facultyData.faculty || []);
      if (studentData.success) setStudentList(studentData.students || []);
      if (complaintsData.success) setComplaintList(complaintsData.complaints || []);
      if (debugData.success) setMongoData(debugData);
    } catch (err) {
      console.error('Error loading maintainer data:', err);
      onNotify('error', 'Could not refresh data: ' + err.message);
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

  // Open Action Modal for Complaint
  const handleOpenActionModal = (complaint) => {
    setSelectedComplaint(complaint);
    setActionForm({
      status: complaint.status || 'Under Review',
      adminNotes: complaint.adminNotes || '',
    });
    setShowActionModal(true);
  };

  // Submit Action/Status Update on Complaint
  const handleUpdateComplaintStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/maintainer/complaints/${selectedComplaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update complaint');
      }

      onNotify('success', `Complaint status updated to "${actionForm.status}" in MongoDB Atlas!`);
      setShowActionModal(false);
      setSelectedComplaint(null);
      await loadData();
    } catch (err) {
      onNotify('error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Complaint from MongoDB
  const handleDeleteComplaint = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to remove the complaint filed by student "${studentName}" from MongoDB?`)) return;
    try {
      const res = await fetch(`/api/maintainer/complaints/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete');
      onNotify('info', 'Complaint record removed from MongoDB Atlas.');
      await loadData();
    } catch (err) {
      onNotify('error', err.message);
    }
  };

  // Open Proof Photo Lightbox Modal
  const handleOpenPhotoPreview = (c) => {
    if (!c.proofImage) return;
    setPreviewPhoto({
      url: c.proofImage,
      studentName: c.studentName || 'Student',
      rollNo: c.studentRollNo || 'N/A',
      studentPhone: c.studentPhone || 'N/A',
      incidentType: c.incidentType,
      incidentDate: c.incidentDate,
      incidentTime: c.incidentTime,
      location: c.location,
      severity: c.severity,
    });
  };

  // Severity color badge helper with exact palette
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Urgent / Emergency':
        return { bg: 'rgba(255, 59, 48, 0.15)', border: '#FF3B30', color: '#FF3B30' };
      case 'High':
        return { bg: 'rgba(255, 106, 0, 0.15)', border: '#FF6A00', color: '#FF6A00' };
      case 'Medium':
        return { bg: 'rgba(255, 184, 0, 0.15)', border: '#FFB800', color: '#FFB800' };
      default:
        return { bg: 'rgba(144, 238, 144, 0.15)', border: '#90EE90', color: '#90EE90' };
    }
  };

  // Status badge helper with exact palette
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return { bg: 'rgba(144, 238, 144, 0.15)', border: 'rgba(144, 238, 144, 0.4)', color: '#90EE90', text: 'Resolved' };
      case 'Action Taken':
        return { bg: 'rgba(191, 90, 242, 0.15)', border: 'rgba(191, 90, 242, 0.4)', color: '#BF5AF2', text: 'Action Taken' };
      case 'Under Review':
        return { bg: 'rgba(0, 245, 255, 0.15)', border: 'rgba(0, 245, 255, 0.4)', color: '#00F5FF', text: 'Under Review' };
      case 'Dismissed':
        return { bg: 'var(--dust-badge)', border: 'var(--dust-border)', color: 'var(--dust-text)', text: 'Dismissed' };
      default:
        return { bg: 'rgba(255, 184, 0, 0.15)', border: 'rgba(255, 184, 0, 0.4)', color: '#FFB800', text: 'Pending' };
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

  const filteredComplaints = complaintList.filter((c) => {
    const matchesSearch =
      c.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentRollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.accusedDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incidentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = complaintStatusFilter === 'All' || c.status === complaintStatusFilter;
    const matchesSeverity = complaintSeverityFilter === 'All' || c.severity === complaintSeverityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const pendingComplaintsCount = complaintList.filter((c) => /pending/i.test(c.status || '')).length;

  return (
    <div className="animate-fade-in">
      {/* Top Welcome & Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Maintainer & Administration Control Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage faculty, students, anti-ragging incident investigations with proof photos, and MongoDB Atlas database storage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('complaints')}
            className="btn btn-secondary"
            style={{
              borderColor: pendingComplaintsCount > 0 ? '#FF3B30' : undefined,
              color: pendingComplaintsCount > 0 ? '#FF3B30' : undefined,
            }}
          >
            <ShieldAlert size={16} />
            <span>Anti-Ragging Cell ({complaintList.length})</span>
            {pendingComplaintsCount > 0 && (
              <span className="badge" style={{ background: '#FF3B30', color: '#fff', fontSize: '0.7rem', padding: '2px 6px' }}>
                {pendingComplaintsCount}
              </span>
            )}
          </button>

          {/* Primary Action Buttons: Neon Orange (#FF6A00) */}
          <button
            onClick={() => setShowAddFacultyModal(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Add New Faculty</span>
          </button>

          <button
            onClick={() => setShowAddStudentModal(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
        {/* Total Faculty: Neon Purple (#BF5AF2) */}
        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dust-text)', textTransform: 'uppercase' }}>
              Total Faculty
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(191, 90, 242, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BF5AF2' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.totalFaculty}</div>
          <span style={{ fontSize: '0.75rem', color: '#BF5AF2' }}>Active Instructors</span>
        </div>

        {/* Total Students: Neon Cyan (#00F5FF) */}
        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dust-text)', textTransform: 'uppercase' }}>
              Total Students
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(0, 245, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00F5FF' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.totalStudents}</div>
          <span style={{ fontSize: '0.75rem', color: '#00F5FF' }}>Section A, B, C Enrolled</span>
        </div>

        {/* Anti-Ragging Complaints KPI Card: Red (#FF3B30) */}
        <div
          className="glass-panel"
          style={{
            padding: 20,
            textAlign: 'left',
            cursor: 'pointer',
            border: activeTab === 'complaints' ? '1px solid #FF3B30' : undefined,
          }}
          onClick={() => setActiveTab('complaints')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dust-text)', textTransform: 'uppercase' }}>
              Ragging Reports
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255, 59, 48, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{complaintList.length}</span>
            {pendingComplaintsCount > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255, 59, 48, 0.25)', color: '#FF3B30', padding: '3px 8px', borderRadius: 9999, border: '1px solid rgba(255, 59, 48, 0.5)' }}>
                {pendingComplaintsCount} Pending
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: pendingComplaintsCount > 0 ? '#FF3B30' : 'var(--dust-text)' }}>
            {pendingComplaintsCount > 0 ? '⚠️ Immediate Action Required' : 'All reports investigated'}
          </span>
        </div>

        {/* MongoDB Live: Light Green (#90EE90) */}
        <div className="glass-panel" style={{ padding: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dust-text)', textTransform: 'uppercase' }}>
              Database Status
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(144, 238, 144, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90EE90' }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
            MongoDB Atlas Live
          </div>
          <span style={{ fontSize: '0.75rem', color: '#90EE90', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#90EE90', boxShadow: '0 0 8px #90EE90' }} />
            Connected & Syncing
          </span>
        </div>
      </div>

      {/* Main Tab Navigation & Controls */}
      <div className="glass-panel" style={{ padding: 24, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(13, 18, 30, 0.8)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
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
              onClick={() => setActiveTab('complaints')}
              className={`btn btn-sm ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '8px 16px',
                background: activeTab === 'complaints' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                color: '#fff',
              }}
            >
              <ShieldAlert size={15} />
              <span>Anti-Ragging Complaints ({complaintList.length})</span>
              {pendingComplaintsCount > 0 && (
                <span
                  style={{
                    background: '#f43f5e',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  {pendingComplaintsCount}
                </span>
              )}
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

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTab === 'students' && (
              <select
                className="form-select"
                style={{ width: 140, paddingBlock: 8, fontSize: '0.85rem' }}
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="All">All Sections</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
              </select>
            )}

            {activeTab === 'complaints' && (
              <>
                <select
                  className="form-select"
                  style={{ width: 160, paddingBlock: 8, fontSize: '0.85rem' }}
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending Investigation">Pending Investigation</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Action Taken">Action Taken</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>

                <select
                  className="form-select"
                  style={{ width: 150, paddingBlock: 8, fontSize: '0.85rem' }}
                  value={complaintSeverityFilter}
                  onChange={(e) => setComplaintSeverityFilter(e.target.value)}
                >
                  <option value="All">All Severities</option>
                  <option value="Urgent / Emergency">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </>
            )}

            {activeTab !== 'mongodb' && (
              <div style={{ position: 'relative', width: 230 }}>
                <input
                  type="text"
                  placeholder={
                    activeTab === 'complaints'
                      ? 'Search student, phone, location...'
                      : 'Search by name, email...'
                  }
                  className="form-input"
                  style={{ paddingLeft: 34, paddingBlock: 8, fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            )}

            <button
              onClick={loadData}
              className="btn btn-secondary btn-sm"
              title="Refresh Live Data"
              style={{ padding: '8px 12px' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ================= TAB 1: FACULTY LIST ================= */}
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
                          className="btn btn-sm btn-secondary"
                          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                          title="Delete Faculty"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 2: STUDENT LIST ================= */}
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
                  <th>Department / Semester</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>
                      No students found matching your criteria. Click "+ Add New Student" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                        {s.rollNo}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700 }}>
                            {s.name.charAt(0)}
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.section === 'Section B' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: s.section === 'Section B' ? '#c084fc' : '#38bdf8',
                            border: `1px solid ${s.section === 'Section B' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                            fontWeight: 700,
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
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {s.department} • {s.semester || 'Semester 4'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="btn btn-sm btn-secondary"
                          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                          title="Delete Student"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 3: ANTI-RAGGING COMPLAINTS (ADMIN VIEW) ================= */}
        {activeTab === 'complaints' && (
          <div>
            {/* Top alert notice */}
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={20} color="#fb7185" />
                <span style={{ fontSize: '0.875rem', color: '#fca5a5' }}>
                  Anti-Ragging Incident Registry: Reviewing reports stored in MongoDB Atlas <code>complaints</code> collection with location, timing, contact phone, and proof photos.
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Showing <strong>{filteredComplaints.length}</strong> of {complaintList.length} incident reports
              </span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Complainant Student (Sender)</th>
                    <th>Where & Which Time</th>
                    <th>Classification & Severity</th>
                    <th>Proof Photo</th>
                    <th>Alleged Perpetrator(s)</th>
                    <th>Investigation Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 36, color: 'var(--text-dim)' }}>
                        {complaintList.length === 0
                          ? 'No ragging complaints have been submitted by students yet.'
                          : 'No complaints match the current filter or search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((c) => {
                      const sev = getSeverityBadge(c.severity);
                      const st = getStatusBadge(c.status);

                      return (
                        <tr key={c.id}>
                          {/* Student Who Sent It */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 6,
                                    background: 'rgba(244, 63, 94, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fb7185',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {c.studentName?.charAt(0) || 'S'}
                                </div>
                                <span style={{ fontWeight: 700, color: '#fff' }}>{c.studentName}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                                <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontSize: '0.7rem', padding: '1px 6px' }}>
                                  {c.studentRollNo || 'N/A'}
                                </span>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1px 6px' }}>
                                  {c.studentSection || 'Section A'}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                {c.studentEmail}
                              </span>
                              {c.studentPhone && (
                                <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                  <Phone size={12} />
                                  <span>{c.studentPhone}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Where & Which Time */}
                          <td>
                            <div style={{ fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                <Clock size={13} />
                                <span>{c.incidentDate}{c.incidentTime ? ` • ${c.incidentTime}` : ''}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, color: 'var(--text-main)', marginTop: 2 }}>
                                <MapPin size={13} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontWeight: 600 }}>{c.location || 'Campus'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Incident Type & Severity */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                                {c.incidentType}
                              </span>
                              <span
                                className="badge"
                                style={{
                                  background: sev.bg,
                                  border: `1px solid ${sev.border}`,
                                  color: sev.color,
                                  fontSize: '0.7rem',
                                  width: 'fit-content',
                                }}
                              >
                                {c.severity}
                              </span>
                            </div>
                          </td>

                          {/* Proof Photo Column (Clickable to Lightbox) */}
                          <td>
                            {c.proofImage ? (
                              <div
                                onClick={() => handleOpenPhotoPreview(c)}
                                style={{
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'rgba(255,255,255,0.03)',
                                  padding: 6,
                                  borderRadius: 8,
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  transition: 'transform 0.2s, border-color 0.2s',
                                }}
                                title="Click to open proof photo in fullscreen with close button"
                              >
                                <div style={{ position: 'relative', width: 70, height: 48, borderRadius: 6, overflow: 'hidden' }}>
                                  <img
                                    src={c.proofImage}
                                    alt="Proof Thumbnail"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                                    }}
                                  >
                                    <Maximize2 size={14} />
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                                  View Photo
                                </span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ImageIcon size={13} />
                                <span>No photo</span>
                              </div>
                            )}
                          </td>

                          {/* Accused Persons */}
                          <td>
                            <div style={{ maxWidth: 180, fontSize: '0.825rem' }}>
                              <span style={{ color: '#fca5a5', fontWeight: 500 }}>
                                {c.accusedDetails || 'Not specified'}
                              </span>
                              {c.witnessDetails && (
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: 3 }}>
                                  Witness: {c.witnessDetails}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span
                                className="badge"
                                style={{
                                  background: st.bg,
                                  border: `1px solid ${st.border}`,
                                  color: st.color,
                                  fontWeight: 700,
                                  width: 'fit-content',
                                }}
                              >
                                {st.text}
                              </span>
                              {c.adminNotes && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-dim)',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    maxWidth: 150,
                                  }}
                                  title={c.adminNotes}
                                >
                                  {c.adminNotes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleOpenActionModal(c)}
                                className="btn btn-sm btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                  fontSize: '0.775rem',
                                }}
                                title="Review details & update action status"
                              >
                                <Eye size={13} />
                                <span>Action</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComplaint(c.id, c.studentName)}
                                className="btn btn-sm btn-secondary"
                                style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)', padding: '6px 8px' }}
                                title="Delete Complaint"
                              >
                                <Trash2 size={13} />
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
          </div>
        )}

        {/* ================= TAB 4: MONGODB LIVE DATA VIEW ================= */}
        {activeTab === 'mongodb' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  MongoDB Atlas Live Collections Inspector
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Database: <strong style={{ color: '#34d399' }}>{mongoData?.databaseName || 'myDatabase'}</strong> • Collections: <strong>faculty, students, attendance, users, complaints</strong>
                </p>
              </div>

              <button onClick={loadData} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} />
                <span>Re-sync Atlas Collections</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Complaints Collection Box */}
              <div style={{ background: 'rgba(13, 18, 30, 0.95)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={16} color="#fb7185" />
                  <span>MongoDB "complaints" Collection ({mongoData?.mongoStats?.totalComplaintsInMongoDB || complaintList.length} docs)</span>
                </h4>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {complaintList.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', padding: 12 }}>No complaint documents in MongoDB Atlas.</div>
                  ) : (
                    complaintList.map((c) => (
                      <div key={c.id} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ color: '#fff' }}>{c.studentName} ({c.studentRollNo})</strong>
                          <span style={{ color: '#fb7185' }}>{c.status}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                          Where: {c.location} • Time: {c.incidentDate} {c.incidentTime || ''}
                        </div>
                        {c.studentPhone && (
                          <div style={{ color: '#34d399', fontSize: '0.725rem', marginTop: 2 }}>
                            Phone: {c.studentPhone}
                          </div>
                        )}
                        {c.proofImage && (
                          <div style={{ color: '#38bdf8', fontSize: '0.725rem', marginTop: 2 }}>
                            ✓ Proof Photo Attached
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Faculty Collection Box */}
              <div style={{ background: 'rgba(13, 18, 30, 0.95)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} color="#10b981" />
                  <span>MongoDB "faculty" Collection ({facultyList.length} docs)</span>
                </h4>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {facultyList.map((f) => (
                    <div key={f.id} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{f.name}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{f.email}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Students Collection Box */}
              <div style={{ background: 'rgba(13, 18, 30, 0.95)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="#818cf8" />
                  <span>MongoDB "students" Collection ({studentList.length} docs)</span>
                </h4>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {studentList.map((s) => (
                    <div key={s.id} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{s.name} ({s.rollNo} • {s.section || 'Sec A'})</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{s.email}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Collection Box */}
              <div style={{ background: 'rgba(13, 18, 30, 0.95)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet size={16} color="#06b6d4" />
                  <span>MongoDB "attendance" Collection</span>
                </h4>
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#06b6d4' }}>
                    {mongoData?.mongoStats?.totalAttendanceInMongoDB || stats.totalAttendanceRecords}
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Total attendance entries in MongoDB Atlas
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

      {/* ================= MODAL: REVIEW & ACTION COMPLAINT ================= */}
      {showActionModal && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>
                    Anti-Ragging Investigation & Action
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                    Updating status in MongoDB Atlas <code>complaints</code> collection
                  </p>
                </div>
              </div>
              <button onClick={() => setShowActionModal(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            {/* Crucial Section: WHICH STUDENT SENT THE COMPLAINT */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>
                <UserCheck size={16} />
                <span>Complainant Student Details (Sender):</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>{' '}
                  <strong style={{ color: '#fff' }}>{selectedComplaint.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Roll Number:</span>{' '}
                  <strong style={{ color: '#38bdf8' }}>{selectedComplaint.studentRollNo || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>{' '}
                  <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{selectedComplaint.studentEmail}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Section & Dept:</span>{' '}
                  <span style={{ color: '#fff' }}>{selectedComplaint.studentSection || 'Section A'} • {selectedComplaint.studentDepartment}</span>
                </div>
                {selectedComplaint.studentPhone && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Contact Phone:</span>{' '}
                    <strong style={{ color: '#34d399' }}>📞 {selectedComplaint.studentPhone}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Details Dossier */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: '0.85rem', marginBottom: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Classification:</span>{' '}
                  <strong style={{ color: '#fff' }}>{selectedComplaint.incidentType}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Severity:</span>{' '}
                  <span
                    className="badge"
                    style={{
                      ...getSeverityBadge(selectedComplaint.severity),
                      fontSize: '0.75rem',
                    }}
                  >
                    {selectedComplaint.severity}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>{' '}
                  <span style={{ color: '#38bdf8' }}>
                    {selectedComplaint.incidentDate} {selectedComplaint.incidentTime ? `(${selectedComplaint.incidentTime})` : ''}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Where (Location):</span>{' '}
                  <strong style={{ color: '#fff' }}>{selectedComplaint.location}</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                <strong>Alleged Accused:</strong>{' '}
                <span style={{ color: '#fca5a5' }}>{selectedComplaint.accusedDetails || 'Not specified'}</span>
              </div>

              {selectedComplaint.witnessDetails && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  <strong>Witnesses:</strong> {selectedComplaint.witnessDetails}
                </div>
              )}

              {/* Proof Photo Preview inside Modal */}
              {selectedComplaint.proofImage && (
                <div style={{ marginBlock: 12, padding: 12, background: 'rgba(13, 18, 30, 0.8)', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: '0.775rem', color: '#38bdf8', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={14} />
                    <span>Attached Proof Photo (Stored in MongoDB):</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={selectedComplaint.proofImage}
                      alt="Proof Evidence"
                      style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onClick={() => handleOpenPhotoPreview(selectedComplaint)}
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoPreview(selectedComplaint)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      <Maximize2 size={13} />
                      <span>Open Full Photo Lightbox</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Student's Incident Description:
                </span>
                <p
                  style={{
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    background: 'rgba(13, 18, 30, 0.7)',
                    padding: 12,
                    borderRadius: 6,
                    marginTop: 6,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {selectedComplaint.description}
                </p>
              </div>
            </div>

            {/* Admin Action Form */}
            <form onSubmit={handleUpdateComplaintStatus}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#fb7185' }}>
                  Update Investigation / Resolution Status *
                </label>
                <select
                  className="form-select"
                  value={actionForm.status}
                  onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                >
                  <option value="Pending Investigation">Pending Investigation (Awaiting Action)</option>
                  <option value="Under Review">Under Review (Committee Assigned & Summoned)</option>
                  <option value="Action Taken">Action Taken (Disciplinary Hearing / Sanctions Enacted)</option>
                  <option value="Resolved">Resolved (Matter Concluded & Closed)</option>
                  <option value="Dismissed">Dismissed (Unsubstantiated / Withdrawn)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Official Committee Findings & Action Taken Remarks *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Anti-Ragging committee met with complainant student and alleged seniors. Written undertaking obtained, warning issued, hostel supervisor alerted."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  value={actionForm.adminNotes}
                  onChange={(e) => setActionForm({ ...actionForm, adminNotes: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                  This resolution log is saved into MongoDB Atlas and will be visible to the complainant student in their dashboard.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}
                >
                  {formSubmitting ? 'Updating in MongoDB...' : 'Save Resolution & Update MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX MODAL: FULL PROOF PHOTO PREVIEW ================= */}
      {previewPhoto && (
        <div
          className="lightbox-overlay"
          onClick={() => setPreviewPhoto(null)}
        >
          {/* Top-Right 'X' Close Button */}
          <button
            onClick={() => setPreviewPhoto(null)}
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
              src={previewPhoto.url}
              alt="Proof Evidence"
              className="lightbox-image"
            />
          </div>

          <div
            className="lightbox-caption"
            onClick={(e) => e.stopPropagation()}
          >
            <Camera size={16} color="#38bdf8" />
            <strong style={{ color: '#fff' }}>Complainant: {previewPhoto.studentName} ({previewPhoto.rollNo})</strong>
            {previewPhoto.studentPhone && previewPhoto.studentPhone !== 'N/A' && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={13} /> {previewPhoto.studentPhone}
                </span>
              </>
            )}
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: '#fb7185' }}>Where: {previewPhoto.location}</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: '#38bdf8' }}>When: {previewPhoto.incidentDate} {previewPhoto.incidentTime ? `at ${previewPhoto.incidentTime}` : ''}</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>Type: {previewPhoto.incidentType}</span>
          </div>
        </div>
      )}

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

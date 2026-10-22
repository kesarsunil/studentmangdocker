import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import {
  connectToMongoDB,
  getDB,
  client,
  getFacultyCollection,
  getStudentsCollection,
  getAttendanceCollection,
  getUsersCollection,
  initCollections,
} from './database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let isMongoConnected = false;
let mongoDb = null;

// Connect to MongoDB Atlas through the dedicated database module
async function tryMongoConnect() {
  try {
    await connectToMongoDB();
    mongoDb = getDB();
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas via ./database module!');

    await initCollections();
    console.log('📁 Dedicated MongoDB Collections ready: "faculty", "students", "attendance", "users".');
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️  MongoDB Atlas connection error:', err.message);
  }
}

// Auto-reconnect interval if connection drops
setInterval(async () => {
  if (!isMongoConnected) {
    try {
      await connectToMongoDB();
      mongoDb = getDB();
      isMongoConnected = true;
      console.log('🎉 MongoDB Atlas connection re-established!');
      await initCollections();
    } catch {
      // Retry silently
    }
  }
}, 15000);

// Middleware to ensure DB connection before processing requests (critical for serverless / cold starts)
app.use(async (req, res, next) => {
  if (!isMongoConnected) {
    try {
      await tryMongoConnect();
    } catch {
      // Failures logged in tryMongoConnect
    }
  }
  next();
});

// ==========================================
// AUTHENTICATION API
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB database is connecting. Please wait a moment and try again.',
      });
    }

    let matchedUser = null;

    // Maintainer default credentials check
    if (cleanRole === 'maintainer') {
      if (
        (cleanEmail === 'maintainer@college.edu' || cleanEmail === 'admin@college.edu') &&
        (cleanPassword === 'admin123' || cleanPassword === 'adminpassword')
      ) {
        matchedUser = {
          _id: 'maintainer_admin',
          name: 'System Maintainer',
          email: cleanEmail,
          role: 'maintainer',
          department: 'Administration',
        };
      }
    }

    // Check role-specific collection
    if (!matchedUser && cleanRole === 'faculty') {
      matchedUser = await getFacultyCollection().findOne({
        email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
        password: cleanPassword,
      });
    } else if (!matchedUser && cleanRole === 'student') {
      matchedUser = await getStudentsCollection().findOne({
        email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
        password: cleanPassword,
      });
    }

    // Check users collection (for maintainer/admin or cross-lookup)
    if (!matchedUser) {
      matchedUser = await getUsersCollection().findOne({
        email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
        password: cleanPassword,
        role: cleanRole,
      });
    }

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials or user not found with role "${role}". Please check email, password, and selected role.`,
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: matchedUser._id?.toString() || matchedUser.id || 'id_' + Date.now(),
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role || cleanRole,
        department: matchedUser.department || 'General',
        rollNo: matchedUser.rollNo || null,
        section: matchedUser.section || (cleanRole === 'student' ? 'Section A' : null),
        subjects: matchedUser.subjects || [],
        semester: matchedUser.semester || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// MAINTAINER APIS
// ==========================================

// Dashboard stats directly from MongoDB
app.get('/api/maintainer/stats', async (req, res) => {
  try {
    if (!isMongoConnected || !mongoDb) {
      return res.json({
        success: true,
        isMongoConnected: false,
        stats: { totalFaculty: 0, totalStudents: 0, totalAttendanceRecords: 0, recentUsers: [] },
      });
    }

    const faculty = await getFacultyCollection().find({}).toArray();
    const students = await getStudentsCollection().find({}).toArray();
    const attendance = await getAttendanceCollection().find({}).toArray();

    const recent = [...faculty, ...students].slice(-6).reverse();

    res.json({
      success: true,
      isMongoConnected,
      stats: {
        totalFaculty: faculty.length,
        totalStudents: students.length,
        totalAttendanceRecords: attendance.length,
        recentUsers: recent.map(u => ({
          id: u._id?.toString() || u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'faculty',
          department: u.department,
          rollNo: u.rollNo || null,
          section: u.section || null,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all faculty directly from MongoDB 'faculty' collection
app.get('/api/maintainer/faculty', async (req, res) => {
  try {
    if (!isMongoConnected || !mongoDb) {
      return res.json({ success: true, isMongoConnected: false, faculty: [] });
    }

    const faculty = await getFacultyCollection().find({}).sort({ createdAt: -1 }).toArray();

    res.json({
      success: true,
      isMongoConnected,
      faculty: faculty.map(f => ({
        id: f._id?.toString() || f.id,
        name: f.name,
        email: f.email,
        password: f.password,
        department: f.department || 'N/A',
        subjects: f.subjects || [],
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new faculty directly into MongoDB 'faculty' collection
app.post('/api/maintainer/faculty', async (req, res) => {
  try {
    const { name, email, password, department, subjects } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({ success: false, message: 'MongoDB Atlas is not connected.' });
    }

    // Check duplicate
    const existing = await getFacultyCollection().findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: `Email "${cleanEmail}" is already registered in MongoDB.` });
    }

    const subjectList = Array.isArray(subjects)
      ? subjects
      : typeof subjects === 'string'
      ? subjects.split(',').map(s => s.trim()).filter(Boolean)
      : ['General Studies'];

    const newFacultyDoc = {
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: 'faculty',
      department: department?.trim() || 'General',
      subjects: subjectList.length > 0 ? subjectList : ['General Studies'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await getFacultyCollection().insertOne(newFacultyDoc);
    await getUsersCollection().updateOne(
      { email: cleanEmail },
      { $set: newFacultyDoc },
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: `Faculty "${newFacultyDoc.name}" created and stored in MongoDB "faculty" collection!`,
      faculty: {
        id: insertResult.insertedId.toString(),
        ...newFacultyDoc,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete faculty directly from MongoDB 'faculty' collection
app.delete('/api/maintainer/faculty/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({ success: false, message: 'MongoDB Atlas is not connected.' });
    }

    if (ObjectId.isValid(id)) {
      const doc = await getFacultyCollection().findOne({ _id: new ObjectId(id) });
      await getFacultyCollection().deleteOne({ _id: new ObjectId(id) });
      if (doc?.email) {
        await getUsersCollection().deleteOne({ email: doc.email.toLowerCase() });
      }
    } else {
      const doc = await getFacultyCollection().findOne({ _id: id });
      await getFacultyCollection().deleteOne({ _id: id });
      if (doc?.email) {
        await getUsersCollection().deleteOne({ email: doc.email.toLowerCase() });
      }
    }

    res.json({ success: true, message: 'Faculty deleted successfully from MongoDB.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all students directly from MongoDB 'students' collection
app.get('/api/maintainer/students', async (req, res) => {
  try {
    if (!isMongoConnected || !mongoDb) {
      return res.json({ success: true, isMongoConnected: false, students: [] });
    }

    const students = await getStudentsCollection().find({}).sort({ rollNo: 1 }).toArray();

    res.json({
      success: true,
      isMongoConnected,
      students: students.map(s => ({
        id: s._id?.toString() || s.id,
        name: s.name,
        email: s.email,
        password: s.password,
        rollNo: s.rollNo || 'N/A',
        section: s.section || 'Section A',
        department: s.department || 'N/A',
        semester: s.semester || 'Semester 1',
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new student directly into MongoDB 'students' collection
app.post('/api/maintainer/students', async (req, res) => {
  try {
    const { name, email, password, rollNo, section, department, semester } = req.body;

    if (!name || !email || !password || !rollNo) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and Roll Number are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRollNo = rollNo.trim().toUpperCase();
    const cleanSection = (section?.trim() || 'Section A');

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({ success: false, message: 'MongoDB Atlas is not connected.' });
    }

    const existingEmail = await getStudentsCollection().findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: `Email "${cleanEmail}" is already registered.` });
    }

    const existingRoll = await getStudentsCollection().findOne({ rollNo: cleanRollNo });
    if (existingRoll) {
      return res.status(400).json({ success: false, message: `Roll Number "${cleanRollNo}" already exists.` });
    }

    const newStudentDoc = {
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: 'student',
      rollNo: cleanRollNo,
      section: cleanSection,
      department: department?.trim() || 'Computer Science',
      semester: semester?.trim() || 'Semester 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await getStudentsCollection().insertOne(newStudentDoc);
    await getUsersCollection().updateOne(
      { email: cleanEmail },
      { $set: newStudentDoc },
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: `Student "${newStudentDoc.name}" (${newStudentDoc.section}) stored in MongoDB "students" collection!`,
      student: {
        id: insertResult.insertedId.toString(),
        ...newStudentDoc,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student directly from MongoDB 'students' collection
app.delete('/api/maintainer/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({ success: false, message: 'MongoDB Atlas is not connected.' });
    }

    if (ObjectId.isValid(id)) {
      const doc = await getStudentsCollection().findOne({ _id: new ObjectId(id) });
      await getStudentsCollection().deleteOne({ _id: new ObjectId(id) });
      if (doc?.email) {
        await getUsersCollection().deleteOne({ email: doc.email.toLowerCase() });
      }
    } else {
      const doc = await getStudentsCollection().findOne({ _id: id });
      await getStudentsCollection().deleteOne({ _id: id });
      if (doc?.email) {
        await getUsersCollection().deleteOne({ email: doc.email.toLowerCase() });
      }
    }

    res.json({ success: true, message: 'Student deleted successfully from MongoDB.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// FACULTY APIS
// ==========================================

// Get students for marking attendance (filtered by section & department)
app.get('/api/faculty/students', async (req, res) => {
  try {
    const { department, section } = req.query;

    if (!isMongoConnected || !mongoDb) {
      return res.json({ success: true, students: [] });
    }

    const query = {};
    if (department && department !== 'All') query.department = department;
    if (section && section !== 'All') query.section = section;

    const students = await getStudentsCollection().find(query).sort({ rollNo: 1 }).toArray();

    res.json({
      success: true,
      students: students.map(s => ({
        id: s._id?.toString() || s.id,
        name: s.name,
        email: s.email,
        rollNo: s.rollNo,
        section: s.section || 'Section A',
        department: s.department,
        semester: s.semester,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit Attendance directly into MongoDB 'attendance' collection
app.post('/api/faculty/attendance', async (req, res) => {
  try {
    const { date, subject, section, facultyId, facultyName, facultyEmail, records } = req.body;

    if (!date || !subject || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Date, subject, and student records are required.' });
    }

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({ success: false, message: 'MongoDB Atlas is not connected.' });
    }

    const defaultSection = section || 'Section A';

    const bulkOps = records.map(rec => {
      const recordSection = rec.section || defaultSection;
      return {
        updateOne: {
          filter: { date, subject, rollNo: rec.rollNo, section: recordSection },
          update: {
            $set: {
              date,
              subject,
              section: recordSection,
              studentId: rec.studentId,
              rollNo: rec.rollNo,
              studentName: rec.name,
              studentEmail: rec.email,
              department: rec.department,
              status: rec.status || 'Present',
              facultyId: facultyId || null,
              facultyName: facultyName || 'Faculty',
              facultyEmail: facultyEmail || null,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      };
    });

    await getAttendanceCollection().bulkWrite(bulkOps);

    res.json({
      success: true,
      message: `Attendance marked successfully for ${records.length} students (${defaultSection}) in MongoDB Atlas!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Attendance History directly from MongoDB
app.get('/api/faculty/attendance-history', async (req, res) => {
  try {
    const { subject, section, date } = req.query;

    if (!isMongoConnected || !mongoDb) {
      return res.json({ success: true, isMongoConnected: false, sessions: [], totalRecords: 0 });
    }

    const filter = {};
    if (subject && subject !== 'All') filter.subject = subject;
    if (section && section !== 'All') filter.section = section;
    if (date) filter.date = date;

    const records = await getAttendanceCollection().find(filter).sort({ date: -1, rollNo: 1 }).toArray();

    const sessionsMap = {};
    records.forEach(r => {
      const sessionSection = r.section || 'Section A';
      const key = `${r.date}__${r.subject}__${sessionSection}`;

      if (!sessionsMap[key]) {
        sessionsMap[key] = {
          id: key,
          date: r.date,
          subject: r.subject,
          section: sessionSection,
          facultyName: r.facultyName || 'Faculty',
          facultyEmail: r.facultyEmail || '',
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0,
          records: [],
        };
      }

      sessionsMap[key].total += 1;
      if (r.status === 'Present') sessionsMap[key].present += 1;
      else if (r.status === 'Absent') sessionsMap[key].absent += 1;
      else if (r.status === 'Late') sessionsMap[key].late += 1;

      sessionsMap[key].records.push({
        id: r._id?.toString() || r.id,
        rollNo: r.rollNo,
        studentName: r.studentName,
        studentEmail: r.studentEmail,
        department: r.department,
        section: sessionSection,
        status: r.status,
      });
    });

    const sessions = Object.values(sessionsMap).map(s => {
      const weightedPresent = s.present + s.late * 0.5;
      s.percentage = s.total > 0 ? Math.round((weightedPresent / s.total) * 100) : 100;
      return s;
    });

    res.json({
      success: true,
      isMongoConnected,
      sessions,
      totalRecords: records.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Attendance Session directly from MongoDB
app.delete('/api/faculty/attendance-session', async (req, res) => {
  try {
    const { date, subject, section } = req.body;
    if (!date || !subject) {
      return res.status(400).json({ success: false, message: 'Date and subject are required.' });
    }

    if (!isMongoConnected || !mongoDb) {
      return res.status(503).json({ success: false, message: 'MongoDB Atlas is not connected.' });
    }

    const filter = { date, subject };
    if (section && section !== 'All') filter.section = section;

    await getAttendanceCollection().deleteMany(filter);

    res.json({ success: true, message: `Attendance session for ${subject} on ${date} removed from MongoDB.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// STUDENT APIS
// ==========================================
app.get('/api/student/summary', async (req, res) => {
  try {
    const { email, studentId } = req.query;

    if (!email && !studentId) {
      return res.status(400).json({ success: false, message: 'Student email or ID is required.' });
    }

    if (!isMongoConnected || !mongoDb) {
      return res.json({
        success: true,
        isMongoConnected: false,
        summary: { totalClasses: 0, present: 0, absent: 0, late: 0, overallPercentage: 100, subjectBreakdown: [] },
        records: [],
      });
    }

    const cleanEmail = email?.trim().toLowerCase();
    const filter = {};
    if (cleanEmail) filter.studentEmail = { $regex: new RegExp(`^${cleanEmail}$`, 'i') };
    if (studentId) filter.studentId = studentId;

    const records = await getAttendanceCollection().find(filter).sort({ date: -1 }).toArray();

    let present = 0;
    let absent = 0;
    let late = 0;
    const subjectMap = {};

    records.forEach(r => {
      const sub = r.subject || 'General';
      if (!subjectMap[sub]) {
        subjectMap[sub] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      subjectMap[sub].total += 1;

      if (r.status === 'Present') {
        present++;
        subjectMap[sub].present += 1;
      } else if (r.status === 'Absent') {
        absent++;
        subjectMap[sub].absent += 1;
      } else if (r.status === 'Late') {
        late++;
        subjectMap[sub].late += 1;
      }
    });

    const totalClasses = records.length;
    const weightedPresent = present + late * 0.5;
    const overallPercentage = totalClasses > 0 ? Math.round((weightedPresent / totalClasses) * 100) : 100;

    const subjectBreakdown = Object.keys(subjectMap).map(subName => {
      const s = subjectMap[subName];
      const sWeighted = s.present + s.late * 0.5;
      const pct = s.total > 0 ? Math.round((sWeighted / s.total) * 100) : 100;
      return {
        subject: subName,
        total: s.total,
        present: s.present,
        absent: s.absent,
        late: s.late,
        percentage: pct,
      };
    });

    res.json({
      success: true,
      isMongoConnected,
      summary: {
        totalClasses,
        present,
        absent,
        late,
        overallPercentage,
        statusLevel: overallPercentage >= 75 ? 'Good' : overallPercentage >= 65 ? 'Warning' : 'Critical',
        subjectBreakdown,
      },
      records: records.map(r => ({
        id: r._id?.toString() || r.id,
        date: r.date,
        subject: r.subject,
        section: r.section || 'Section A',
        status: r.status,
        facultyName: r.facultyName || 'Faculty',
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// System Overview (Reports all collections in MongoDB Atlas)
app.get('/api/debug/overview', async (req, res) => {
  try {
    let mongoFaculty = [];
    let mongoStudents = [];
    let mongoAttCount = 0;

    if (isMongoConnected && mongoDb) {
      try {
        mongoFaculty = await getFacultyCollection().find({}, { projection: { password: 0 } }).toArray();
        mongoStudents = await getStudentsCollection().find({}, { projection: { password: 0 } }).toArray();
        mongoAttCount = await getAttendanceCollection().countDocuments();
      } catch (e) {
        console.error('Mongo debug overview error:', e.message);
      }
    }

    res.json({
      success: true,
      isMongoConnected,
      databaseName: mongoDb?.databaseName || process.env.DB_NAME || 'myDatabase',
      collections: ['faculty', 'students', 'attendance', 'users'],
      mongoStats: {
        totalFacultyInMongoDB: mongoFaculty.length,
        totalStudentsInMongoDB: mongoStudents.length,
        totalAttendanceInMongoDB: mongoAttCount,
        facultyInMongoDB: mongoFaculty.map(f => ({
          id: f._id.toString(),
          name: f.name,
          email: f.email,
          department: f.department,
          subjects: f.subjects,
        })),
        studentsInMongoDB: mongoStudents.map(s => ({
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          rollNo: s.rollNo,
          section: s.section,
          department: s.department,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', isMongoConnected, time: new Date() });
});

// Start Express Server locally or in Docker; export app for Vercel Serverless
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Attendance Backend Server live at: http://localhost:${PORT}`);
    console.log(`======================================================`);

    await tryMongoConnect();
  });
} else {
  // In Vercel serverless environment, initiate connection on startup
  tryMongoConnect().catch((err) => {
    console.warn('⚠️  Vercel initial MongoDB connection attempt:', err.message);
  });
}

export default app;

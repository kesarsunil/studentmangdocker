import { getDB } from './db.js';

/**
 * Access the dedicated 'attendance' collection in MongoDB Atlas
 * @returns {import('mongodb').Collection}
 */
export function getAttendanceCollection() {
  return getDB().collection('attendance');
}

/**
 * Mark and bulk upsert attendance records into MongoDB Atlas
 */
export async function markAttendance({ date, subject, section, facultyId, facultyName, facultyEmail, records }) {
  const collection = getAttendanceCollection();
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

  return await collection.bulkWrite(bulkOps);
}

/**
 * Get attendance history sessions grouped by Date + Subject + Section
 */
export async function getAttendanceHistory({ subject, section, date } = {}) {
  const collection = getAttendanceCollection();
  const filter = {};

  if (subject && subject !== 'All') filter.subject = subject;
  if (section && section !== 'All') filter.section = section;
  if (date) filter.date = date;

  const records = await collection.find(filter).sort({ date: -1, rollNo: 1 }).toArray();

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

  return { sessions, totalRecords: records.length };
}

/**
 * Delete an attendance session by date, subject, and optional section
 */
export async function deleteAttendanceSession({ date, subject, section }) {
  const collection = getAttendanceCollection();
  const filter = { date, subject };
  if (section && section !== 'All') filter.section = section;

  return await collection.deleteMany(filter);
}

/**
 * Calculate attendance summary for a student
 */
export async function getStudentAttendanceSummary({ email, studentId }) {
  const collection = getAttendanceCollection();
  const cleanEmail = email?.trim().toLowerCase();
  const filter = {};

  if (cleanEmail) filter.studentEmail = { $regex: new RegExp(`^${cleanEmail}$`, 'i') };
  if (studentId) filter.studentId = studentId;

  const records = await collection.find(filter).sort({ date: -1 }).toArray();

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

  return {
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
  };
}

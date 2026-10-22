import { getDB, ObjectId } from './db.js';

/**
 * Access the dedicated 'students' collection in MongoDB Atlas
 * @returns {import('mongodb').Collection}
 */
export function getStudentsCollection() {
  return getDB().collection('students');
}

/**
 * Retrieve all students with optional department & section filters
 */
export async function getAllStudents(filters = {}) {
  const collection = getStudentsCollection();
  const query = {};

  if (filters.department && filters.department !== 'All') {
    query.department = filters.department;
  }
  if (filters.section && filters.section !== 'All') {
    query.section = filters.section;
  }

  return await collection.find(query).sort({ rollNo: 1 }).toArray();
}

/**
 * Find a student by ID
 */
export async function getStudentById(id) {
  const collection = getStudentsCollection();
  if (ObjectId.isValid(id)) {
    return await collection.findOne({ _id: new ObjectId(id) });
  }
  return await collection.findOne({ _id: id });
}

/**
 * Find a student by email
 */
export async function getStudentByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  const collection = getStudentsCollection();
  return await collection.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
}

/**
 * Create and insert a new student document into MongoDB Atlas
 */
export async function createStudent({ name, email, password, rollNo, section, department, semester }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanRollNo = rollNo.trim().toUpperCase();
  const cleanSection = section?.trim() || 'Section A';
  const collection = getStudentsCollection();

  const existingEmail = await collection.findOne({ email: cleanEmail });
  if (existingEmail) {
    throw new Error(`Email "${cleanEmail}" is already registered as a student.`);
  }

  const existingRoll = await collection.findOne({ rollNo: cleanRollNo });
  if (existingRoll) {
    throw new Error(`Roll Number "${cleanRollNo}" already exists.`);
  }

  const newStudent = {
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

  const result = await collection.insertOne(newStudent);
  return {
    id: result.insertedId.toString(),
    ...newStudent,
  };
}

/**
 * Delete a student document by ID
 */
export async function deleteStudent(id) {
  const collection = getStudentsCollection();
  let studentDoc = null;

  if (ObjectId.isValid(id)) {
    studentDoc = await collection.findOne({ _id: new ObjectId(id) });
    await collection.deleteOne({ _id: new ObjectId(id) });
  } else {
    studentDoc = await collection.findOne({ _id: id });
    await collection.deleteOne({ _id: id });
  }

  return studentDoc;
}

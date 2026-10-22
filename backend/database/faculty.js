import { getDB, ObjectId } from './db.js';

/**
 * Access the dedicated 'faculty' collection in MongoDB Atlas
 * @returns {import('mongodb').Collection}
 */
export function getFacultyCollection() {
  return getDB().collection('faculty');
}

/**
 * Retrieve all faculty records
 */
export async function getAllFaculty() {
  const collection = getFacultyCollection();
  return await collection.find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * Find a faculty member by ID
 */
export async function getFacultyById(id) {
  const collection = getFacultyCollection();
  if (ObjectId.isValid(id)) {
    return await collection.findOne({ _id: new ObjectId(id) });
  }
  return await collection.findOne({ _id: id });
}

/**
 * Find a faculty member by email
 */
export async function getFacultyByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  const collection = getFacultyCollection();
  return await collection.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
}

/**
 * Create and insert a new faculty document into MongoDB Atlas
 */
export async function createFaculty({ name, email, password, department, subjects }) {
  const cleanEmail = email.trim().toLowerCase();
  const collection = getFacultyCollection();

  const existing = await collection.findOne({ email: cleanEmail });
  if (existing) {
    throw new Error(`Email "${cleanEmail}" is already registered as faculty.`);
  }

  const subjectList = Array.isArray(subjects)
    ? subjects
    : typeof subjects === 'string'
    ? subjects.split(',').map(s => s.trim()).filter(Boolean)
    : ['General Studies'];

  const newFaculty = {
    name: name.trim(),
    email: cleanEmail,
    password: password.trim(),
    role: 'faculty',
    department: department?.trim() || 'General',
    subjects: subjectList.length > 0 ? subjectList : ['General Studies'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newFaculty);
  return {
    id: result.insertedId.toString(),
    ...newFaculty,
  };
}

/**
 * Delete a faculty document by ID
 */
export async function deleteFaculty(id) {
  const collection = getFacultyCollection();
  let facultyDoc = null;

  if (ObjectId.isValid(id)) {
    facultyDoc = await collection.findOne({ _id: new ObjectId(id) });
    await collection.deleteOne({ _id: new ObjectId(id) });
  } else {
    facultyDoc = await collection.findOne({ _id: id });
    await collection.deleteOne({ _id: id });
  }

  return facultyDoc;
}

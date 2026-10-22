// MongoDB Atlas Connection
import {
  client,
  connectToMongoDB,
  connectDB,
  getDB,
  disconnectFromMongoDB,
  ObjectId,
} from './db.js';

// Dedicated Collection Handlers
import {
  getFacultyCollection,
  getAllFaculty,
  getFacultyById,
  getFacultyByEmail,
  createFaculty,
  deleteFaculty,
} from './faculty.js';

import {
  getStudentsCollection,
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  createStudent,
  deleteStudent,
} from './students.js';

import {
  getAttendanceCollection,
  markAttendance,
  getAttendanceHistory,
  getStudentAttendanceSummary,
  deleteAttendanceSession,
} from './attendance.js';

import {
  getUsersCollection,
  authenticateUser,
  syncUserWithUsersCollection,
  deleteUserByEmail,
} from './users.js';

import { initCollections } from './collections.js';

// Named exports
export {
  client,
  connectToMongoDB,
  connectDB,
  getDB,
  disconnectFromMongoDB,
  ObjectId,
  getFacultyCollection,
  getAllFaculty,
  getFacultyById,
  getFacultyByEmail,
  createFaculty,
  deleteFaculty,
  getStudentsCollection,
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  createStudent,
  deleteStudent,
  getAttendanceCollection,
  markAttendance,
  getAttendanceHistory,
  getStudentAttendanceSummary,
  deleteAttendanceSession,
  getUsersCollection,
  authenticateUser,
  syncUserWithUsersCollection,
  deleteUserByEmail,
  initCollections,
};

// Default export for maximum compatibility across bundlers and runtimes
export default {
  client,
  connectToMongoDB,
  connectDB,
  getDB,
  disconnectFromMongoDB,
  ObjectId,
  getFacultyCollection,
  getAllFaculty,
  getFacultyById,
  getFacultyByEmail,
  createFaculty,
  deleteFaculty,
  getStudentsCollection,
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  createStudent,
  deleteStudent,
  getAttendanceCollection,
  markAttendance,
  getAttendanceHistory,
  getStudentAttendanceSummary,
  deleteAttendanceSession,
  getUsersCollection,
  authenticateUser,
  syncUserWithUsersCollection,
  deleteUserByEmail,
  initCollections,
};

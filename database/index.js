// MongoDB Atlas Connection
export {
  client,
  connectToMongoDB,
  connectDB,
  getDB,
  disconnectFromMongoDB,
  ObjectId,
} from './db.js';

// Dedicated Collection Handlers
export {
  getFacultyCollection,
  getAllFaculty,
  getFacultyById,
  getFacultyByEmail,
  createFaculty,
  deleteFaculty,
} from './faculty.js';

export {
  getStudentsCollection,
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  createStudent,
  deleteStudent,
} from './students.js';

export {
  getAttendanceCollection,
  markAttendance,
  getAttendanceHistory,
  getStudentAttendanceSummary,
  deleteAttendanceSession,
} from './attendance.js';

export {
  getUsersCollection,
  authenticateUser,
  syncUserWithUsersCollection,
  deleteUserByEmail,
} from './users.js';

export { initCollections } from './collections.js';

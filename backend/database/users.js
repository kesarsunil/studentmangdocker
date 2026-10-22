import { getDB } from './db.js';
import { getFacultyCollection } from './faculty.js';
import { getStudentsCollection } from './students.js';

/**
 * Access the 'users' collection in MongoDB Atlas
 * @returns {import('mongodb').Collection}
 */
export function getUsersCollection() {
  return getDB().collection('users');
}

/**
 * Authenticate user across dedicated collections and fallback to users collection
 */
export async function authenticateUser({ email, password, role }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.trim().toLowerCase();
  const cleanPassword = password.trim();

  let matchedUser = null;

  // 1. Built-in maintainer account
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

  // 2. Role-specific collection lookup
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

  // 3. Fallback to users collection
  if (!matchedUser) {
    matchedUser = await getUsersCollection().findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
      password: cleanPassword,
      role: cleanRole,
    });
  }

  return matchedUser;
}

/**
 * Sync user document with users collection
 */
export async function syncUserWithUsersCollection(userDoc) {
  const collection = getUsersCollection();
  const cleanEmail = userDoc.email.trim().toLowerCase();
  return await collection.updateOne(
    { email: cleanEmail },
    { $set: { ...userDoc, email: cleanEmail, updatedAt: new Date() } },
    { upsert: true }
  );
}

/**
 * Delete user from users collection by email
 */
export async function deleteUserByEmail(email) {
  const collection = getUsersCollection();
  const cleanEmail = email.trim().toLowerCase();
  return await collection.deleteOne({ email: cleanEmail });
}

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve mongodb and dotenv from backend/node_modules
let MongoClient, ServerApiVersion, ObjectId, dotenv;
try {
  const require = createRequire(path.join(__dirname, '../backend/package.json'));
  const mongodb = require('mongodb');
  MongoClient = mongodb.MongoClient;
  ServerApiVersion = mongodb.ServerApiVersion;
  ObjectId = mongodb.ObjectId;
  dotenv = require('dotenv');
} catch {
  const require = createRequire(import.meta.url);
  const mongodb = require('mongodb');
  MongoClient = mongodb.MongoClient;
  ServerApiVersion = mongodb.ServerApiVersion;
  ObjectId = mongodb.ObjectId;
  dotenv = require('dotenv');
}

export { MongoClient, ServerApiVersion, ObjectId };

// Load .env from backend folder or root
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
}
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

// Fix for Windows DNS resolving MongoDB SRV records (ECONNREFUSED querySrv)
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Use system default if custom DNS assignment fails
  }
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('⚠️  Warning: MONGODB_URI is not defined in environment variables. Please configure MONGODB_URI in Vercel Project Settings.');
}

// Safely create MongoClient instance only if URI exists at module load time
export let client = uri
  ? new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    })
  : null;

let dbInstance = null;

export async function connectToMongoDB() {
  if (dbInstance) {
    return client;
  }

  const currentUri = process.env.MONGODB_URI;
  if (!currentUri) {
    const errorMsg = 'MONGODB_URI is not defined. Please configure MONGODB_URI in Vercel Project Settings -> Environment Variables.';
    console.error('❌ Error:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!client) {
    client = new MongoClient(currentUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }

  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('✅ You successfully connected to MongoDB Atlas!');

    const dbName = process.env.DB_NAME || 'myDatabase';
    dbInstance = client.db(dbName);
    console.log(`📁 Database selected: "${dbName}"`);

    return client;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err;
  }
}

export const connectDB = connectToMongoDB;

export function getDB() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Please call connectToMongoDB() first.');
  }
  return dbInstance;
}

export async function disconnectFromMongoDB() {
  try {
    if (client) {
      await client.close();
    }
    dbInstance = null;
    console.log('🔌 Disconnected from MongoDB Atlas.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
}

// If run directly (e.g. `node database/db.js`)
if (process.argv[1] && (process.argv[1].endsWith('db.js') || process.argv[1].endsWith('db.mjs'))) {
  (async () => {
    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      await connectToMongoDB();
      const db = getDB();
      const collections = await db.listCollections().toArray();
      console.log('📁 Collections in database:', collections.map(c => c.name));
      console.log('🎉 MongoDB Atlas connection test PASSED!');
      await disconnectFromMongoDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Connection test failed:', err.message);
      process.exit(1);
    }
  })();
}

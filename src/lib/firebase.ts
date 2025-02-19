import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let database: Database | undefined;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

type UserStats = {
  login: string;
  lastActive: Date;
  stats?: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
  };
};

// Add type for database user
type DatabaseUser = {
  login: string;
  lastActive: string;
  stats?: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
  };
};

export const addUserToDatabase = async (userId: string, userData: UserStats) => {
  if (!database) {
    console.error("Firebase database not initialized");
    return false;
  }

  try {
    console.log(`Writing to Firebase path: users/${userId}`, userData);
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      ...userData,
      lastActive: userData.lastActive.toISOString(),
    });
    console.log("Successfully wrote to Firebase");
    return true;
  } catch (error) {
    console.error('Error adding user to database:', error);
    return false;
  }
};

export const updateUserStats = async (userId: string, stats: {
  totalPRs: number;
  mergedPRs: number;
  contributions: number;
}) => {
  if (!database) {
    console.error("Firebase database not initialized");
    return false;
  }

  try {
    await update(ref(database, `users/${userId}/stats`), stats);
    return true;
  } catch (error) {
    console.error('Error updating user stats:', error);
    return false;
  }
};

export const getActiveUsers = async () => {
  if (!database) {
    console.error("Firebase database not initialized");
    return [];
  }

  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'users'));
    
    if (snapshot.exists()) {
      const users = snapshot.val() as Record<string, DatabaseUser>;
      return Object.values(users).map((user) => ({
        login: user.login,
        lastActive: new Date(user.lastActive),
        stats: {
          totalPRs: user.stats?.totalPRs || 0,
          mergedPRs: user.stats?.mergedPRs || 0,
          contributions: user.stats?.contributions || 0,
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching users from database:', error);
    return [];
  }
}; 
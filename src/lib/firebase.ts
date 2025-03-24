import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, get, child, update, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let database: Database | undefined;

// Only initialize if no apps exist yet
if (typeof window !== 'undefined' && getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("Firebase initialized successfully (client-side)");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else if (getApps().length === 0) {
  // Server-side initialization
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("Firebase initialized successfully (server-side)");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  // Use existing app
  app = getApps()[0];
  database = getDatabase(app);
}

type UserStats = {
  login: string;
  lastActive: Date;
  stats?: {
    totalPRs: number;
    mergedPRs: number;
    contributions: number;
    orgPRs?: number;
    orgMergedPRs?: number;
    points?: number;
    level?: string;
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
    orgPRs?: number;
    orgMergedPRs?: number;
    points?: number;
    level?: string;
  };
};

export const addUserToDatabase = async (userId: string, userData: UserStats) => {
  if (!database) {
    console.error("Firebase database not initialized");
    return false;
  }

  try {
    console.log(`Attempting to write to Firebase for user ${userId}:`, userData);
    console.log('Database instance:', database);
    console.log('Database URL:', database.app.options.databaseURL);
    
    const userRef = ref(database, `users/${userId}`);
    console.log('User reference created:', userRef.key);
    
    const dataToWrite = {
      ...userData,
      lastActive: userData.lastActive.toISOString(),
    };
    console.log('Data to write:', dataToWrite);
    
    await set(userRef, dataToWrite);
    console.log("Successfully wrote to Firebase");
    return true;
  } catch (error) {
    console.error('Error adding user to database:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        code: (error as {code?: string}).code,
        message: error.message,
        stack: error.stack
      });
    }
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
          orgPRs: user.stats?.orgPRs || 0,
          orgMergedPRs: user.stats?.orgMergedPRs || 0,
          points: user.stats?.points || 0,
          level: user.stats?.level || 'Newcomer',
        }
      }));
    }
    console.log('No users found in Firebase');
    return [];
  } catch (error) {
    console.error('Error fetching users from database:', error);
    return [];
  }
};

// Update the test function to use the users path
export const testFirebaseConnection = async () => {
  if (!database) {
    console.error("Firebase database not initialized");
    return false;
  }

  try {
    const testRef = ref(database, 'users/test-connection');
    await set(testRef, {
      timestamp: new Date().toISOString(),
      message: 'Test connection successful'
    });
    console.log("Firebase test write successful");
    return true;
  } catch (error) {
    console.error('Firebase test write failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        code: (error as {code?: string}).code,
        message: error.message,
        stack: error.stack
      });
    }
    return false;
  }
}; 
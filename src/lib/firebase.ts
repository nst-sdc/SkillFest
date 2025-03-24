import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, get, child, update, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://skillfest-6999c-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Add this at the top of your file
const logFirebaseConfig = () => {
  // Log a sanitized version of the config (without actual keys)
  console.log("Firebase config check:", {
    apiKeyExists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomainExists: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURLExists: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucketExists: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  });
};

// Call this before initializing Firebase
logFirebaseConfig();

// Replace your current initialization code with this
let app;
let database: Database | undefined;

// Only initialize if no apps exist yet
if (typeof window !== 'undefined') {
  try {
    console.log("Attempting to initialize Firebase (client-side)");
    
    // Check if we already have initialized apps
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    database = getDatabase(app);
    console.log("Firebase initialized successfully (client-side)");
    console.log("Database URL:", database.app.options.databaseURL);
  } catch (error) {
    console.error("Error initializing Firebase (client-side):", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
  }
} else {
  // Server-side initialization
  try {
    console.log("Attempting to initialize Firebase (server-side)");
    
    // Check if we already have initialized apps
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    database = getDatabase(app);
    console.log("Firebase initialized successfully (server-side)");
  } catch (error) {
    console.error("Error initializing Firebase (server-side):", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
  }
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
    console.log("Testing Firebase connection to:", database.app.options.databaseURL);
    const testRef = ref(database, 'users/test-connection');
    await set(testRef, {
      timestamp: new Date().toISOString(),
      message: 'Test connection successful',
      environment: process.env.NODE_ENV
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
      
      // Check for specific error types
      if ((error as {code?: string}).code === 'PERMISSION_DENIED') {
        console.error('This is a Firebase rules issue. Check your database rules.');
      }
    }
    return false;
  }
}; 
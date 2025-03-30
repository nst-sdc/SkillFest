import { ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase-config";

// Define the application data type
export type FresherApplication = {
  id: string;
  name: string;
  email: string;
  experience: string;
  interests: string;
  whyJoin: string;
  github: string;
  portfolio: string;
  availability: string;
  submittedAt: string;
  status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';
};

/**
 * Stores a fresher application in Firebase
 */
export const storeFresherApplication = async (application: Omit<FresherApplication, 'id' | 'submittedAt' | 'status'>): Promise<string> => {
  try {
    // Generate a unique ID for the application
    const id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the full application object
    const fullApplication: FresherApplication = {
      ...application,
      id,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Store in Firebase under test/applications/{id}
    const applicationRef = ref(db, `test/applications/${id}`);
    await set(applicationRef, fullApplication);
    
    console.log("Successfully stored application:", id);
    return id;
  } catch (error) {
    console.error('Error storing application:', error);
    throw error;
  }
};

/**
 * Retrieves all fresher applications
 */
export const getAllApplications = async (): Promise<FresherApplication[]> => {
  try {
    // Use test/applications path
    const applicationsRef = ref(db, 'test/applications');
    const snapshot = await get(applicationsRef);
    
    if (snapshot.exists()) {
      const applications = snapshot.val();
      return Object.values(applications) as FresherApplication[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
};

/**
 * Retrieves a single application by ID
 */
export const getApplicationById = async (id: string): Promise<FresherApplication | null> => {
  try {
    // Use test/applications path
    const applicationRef = ref(db, `test/applications/${id}`);
    const snapshot = await get(applicationRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as FresherApplication;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    return null;
  }
}; 
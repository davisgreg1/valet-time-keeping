import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Check if user is admin
export const isAdmin = async (userId) => {
  try {
    const adminDocRef = doc(db, "admins", userId);
    const adminDoc = await getDoc(adminDocRef);
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Get admin profile
export const getAdminProfile = async (userId) => {
  try {
    const adminDocRef = doc(db, "admins", userId);
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists()) {
      return { success: true, data: adminDoc.data() };
    } else {
      return { success: false, error: "Admin profile not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create admin user (for initial setup)
export const createAdmin = async (userId, adminData) => {
  try {
    await setDoc(doc(db, "admins", userId), {
      ...adminData,
      createdAt: new Date().toISOString(),
      role: "admin",
      permissions: {
        manageValets: true,
        viewReports: true,
        editClockIns: true,
        exportData: true,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const createValetAccount = async (valetData, adminUser) => {
  // Store current admin user state
  const currentUser = auth.currentUser;

  try {
    // Create the valet account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      valetData.email,
      valetData.temporaryPassword
    );

    const newUser = userCredential.user;

    // Create valet profile in Firestore
    await setDoc(doc(db, "valets", newUser.uid), {
      email: valetData.email,
      fullName: valetData.fullName,
      phoneNumber: valetData.phoneNumber || null,
      employeeId: valetData.employeeId || null,
      department: valetData.department,
      createdAt: new Date().toISOString(),
      isActive: true,
      createdByAdmin: true,
      createdBy: adminUser.uid,
      temporaryPassword: valetData.temporaryPassword,
    });

    // Sign out the newly created user (since we don't want them logged in)
    await signOut(auth);

    // Re-authenticate the admin user
    // Note: In a production environment, you'd want to use Firebase Admin SDK
    // for server-side user creation to avoid this workaround

    return {
      success: true,
      userId: newUser.uid,
      temporaryPassword: valetData.temporaryPassword,
    };
  } catch (error) {
    console.error("Error creating valet account:", error);

    // Try to restore admin session if something went wrong
    if (currentUser) {
      try {
        // This is a simplified approach - in production you'd handle this more securely
        await signOut(auth);
      } catch (restoreError) {
        console.error("Error during cleanup:", restoreError);
      }
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

export const generateTemporaryPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const specialChars = "!@#$%";
  let password = "";

  // Generate 8 random characters
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Add 2 special characters
  for (let i = 0; i < 2; i++) {
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length)
    );
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const createValetAccount = async (valetData, adminUser) => {
  try {
    // Call your API route instead of using Firebase Client SDK
    const response = await fetch("/api/admin/create-valet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: valetData.email,
        password: valetData.temporaryPassword,
        fullName: valetData.fullName,
        phoneNumber: valetData.phoneNumber || null,
        employeeId: valetData.employeeId || null,
        department: valetData.department,
        createdBy: adminUser.uid,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create valet account");
    }

    return {
      success: true,
      userId: result.uid,
      temporaryPassword: valetData.temporaryPassword,
    };
  } catch (error) {
    console.error("Error creating valet account:", error);
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

  // Generate 6 random characters
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

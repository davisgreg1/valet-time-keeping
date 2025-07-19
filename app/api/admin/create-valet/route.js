// app/api/admin/create-valet/route.js

import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export async function POST(request) {
  try {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      employeeId,
      department,
      createdBy,
    } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Create user with Firebase Admin SDK (doesn't affect current auth session)
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: fullName,
    });

    // Create valet profile in Firestore using Admin SDK
    await adminDb.collection("valets").doc(userRecord.uid).set({
      email: email,
      fullName: fullName,
      phoneNumber: phoneNumber,
      employeeId: employeeId,
      department: department,
      createdAt: new Date().toISOString(),
      isActive: true,
      createdByAdmin: true,
      createdBy: createdBy,
      temporaryPassword: password,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: "Valet account created successfully",
    });
  } catch (error) {
    console.error("Error creating valet account:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    if (error.code === "auth/invalid-email") {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "Password is too weak. It should be at least 6 characters." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create valet account" },
      { status: 500 }
    );
  }
}

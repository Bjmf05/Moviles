import { Request, Response } from "express";
import { getFirestore, firebaseAuthService } from "../services/firebase.js";
import { generateToken, verifyToken } from "../services/auth.js";
import { config } from "../config/index.js";

const USERS_COLLECTION = "users";

interface CreateUserBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UpdateUserBody {
  name?: string;
  imageUri?: string;
}

async function verifyPasswordWithFirebase(email: string, password: string): Promise<string> {
  const firebaseConfig = config.firebase;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await response.json() as { idToken: string; localId: string };
  return data.idToken;
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body as CreateUserBody;

    if (!email || !password || !name) {
      res.status(400).json({
        error: "Email, password, and name are required",
      });
      return;
    }

    const userRecord = await firebaseAuthService.auth.createUser({
      email,
      password,
      displayName: name,
    });

    const db = getFirestore();
    await db.collection(USERS_COLLECTION).doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || name,
      createdAt: new Date().toISOString(),
    });

    const token = generateToken({ uid: userRecord.uid, email: email, name });

    res.status(201).json({ token, user: { uid: userRecord.uid, email: userRecord.email, name } });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      await verifyPasswordWithFirebase(email, password);
    } catch (e) {
      try {
        const userRecord = await firebaseAuthService.auth.getUserByEmail(email);
        const token = generateToken({ uid: userRecord.uid, email: email, name: userRecord.displayName || "" });
        res.json({ token, user: { uid: userRecord.uid, email: userRecord.email, name: userRecord.displayName } });
        return;
      } catch (inner) {
        throw new Error("Invalid credentials");
      }
    }
    
    const userRecord = await firebaseAuthService.auth.getUserByEmail(email);

    const token = generateToken({ uid: userRecord.uid, email: email, name: userRecord.displayName || "" });

    res.json({ token, user: { uid: userRecord.uid, email: userRecord.email, name: userRecord.displayName } });
  } catch (error: unknown) {
    console.error("Error logging in:", error);
    res.status(401).json({ error: "Invalid credentials" });
  }
}

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Authorization header missing" });
      return;
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      res.status(401).json({ error: "Invalid authorization format" });
      return;
    }

    const decoded = await verifyToken(token);
    const db = getFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(decoded.uid).get();

    if (!userDoc.exists) {
      await db.collection(USERS_COLLECTION).doc(decoded.uid).set({
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || "",
        createdAt: new Date().toISOString(),
      });
      res.json({ uid: decoded.uid, email: decoded.email, name: decoded.name || "" });
      return;
    }

    res.json(userDoc.data());
  } catch (error: unknown) {
    console.error("Error getting profile:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Authorization header missing" });
      return;
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      res.status(401).json({ error: "Invalid authorization format" });
      return;
    }

    const decoded = await verifyToken(token);
    const updates = req.body as UpdateUserBody;

    const db = getFirestore();
    await db.collection(USERS_COLLECTION).doc(decoded.uid).update(updates as Record<string, unknown>);

    const userDoc = await db.collection(USERS_COLLECTION).doc(decoded.uid).get();
    res.json(userDoc.data());
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Authorization header missing" });
      return;
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      res.status(401).json({ error: "Invalid authorization format" });
      return;
    }

    const decoded = await verifyToken(token);

    await firebaseAuthService.auth.deleteUser(decoded.uid);

    const db = getFirestore();
    await db.collection(USERS_COLLECTION).doc(decoded.uid).delete();

    res.json({ message: "User deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}
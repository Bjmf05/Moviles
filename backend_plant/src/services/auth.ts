import { getFirebaseAuth, verifyIdToken } from "./firebase.js";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";

export interface TokenPayload {
  uid: string;
  email?: string;
  name?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "plant-app-secret-key-change-in-production";

export async function createCustomToken(uid: string, additionalClaims?: Record<string, unknown>): Promise<string> {
  const auth = getFirebaseAuth();
  return auth.createCustomToken(uid, additionalClaims);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (e) {
    const decoded = await verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email,
    };
  }
}

export async function authenticateRequest(
  authHeader: string | undefined
): Promise<TokenPayload> {
  if (!authHeader) {
    throw new Error("Authorization header missing");
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer") {
    throw new Error("Invalid authorization type");
  }

  if (!token) {
    throw new Error("Token missing");
  }

  return verifyToken(token);
}
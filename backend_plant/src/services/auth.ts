import { getFirebaseAuth } from "./firebase.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export interface TokenPayload {
  uid: string;
  email?: string;
  name?: string;
}

const JWT_SECRET = config.jwt.secret;
export async function createCustomToken(
  uid: string,
  additionalClaims?: Record<string, unknown>,
): Promise<string> {
  const auth = getFirebaseAuth();
  return auth.createCustomToken(uid, additionalClaims);
}

export function generateToken(payload: TokenPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in configuration");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in configuration");
    }
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (e) {
    throw new Error(
      `Invalid JWT token: ${e instanceof Error ? e.message : "Unknown error"}`,
    );
  }
}

export async function authenticateRequest(
  authHeader: string | undefined,
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

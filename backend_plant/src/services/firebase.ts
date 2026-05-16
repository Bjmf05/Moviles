import admin from "firebase-admin";
import { requireValidConfig } from "../config/index.js";

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

export async function initFirebase(): Promise<void> {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
    return;
  }

  const cfg = requireValidConfig();

  if (!cfg.firebase.projectId || !cfg.firebase.privateKey) {
    console.warn("Firebase not configured - auth endpoints will not work");
    return;
  }

  const sanitizeEnv = (value: string | undefined): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.replace(/^"|"$/g, "");
  };

  const clientEmail = sanitizeEnv(cfg.firebase.clientEmail);
  const privateKey = sanitizeEnv(cfg.firebase.privateKey)?.replace(
    /\\n/g,
    "\n",
  );

  const serviceAccount: admin.ServiceAccount = {
    projectId: cfg.firebase.projectId,
    clientEmail: clientEmail || undefined,
    privateKey: privateKey,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  auth = admin.auth();
}

export function getFirestore(): admin.firestore.Firestore {
  if (!db) throw new Error("Firebase not initialized");
  return db;
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!auth) throw new Error("Firebase not initialized");
  return auth;
}

export function getFirebaseAuthLazy(): admin.auth.Auth {
  if (!auth) {
    throw new Error("Firebase not initialized. Call initFirebase() first.");
  }
  return auth;
}

export async function verifyIdToken(
  token: string,
): Promise<admin.auth.DecodedIdToken> {
  return getFirebaseAuth().verifyIdToken(token);
}

export const firebaseAuthService = {
  get auth() {
    return getFirebaseAuthLazy();
  },
  createCustomToken(
    uid: string,
    additionalClaims?: Record<string, unknown>,
  ): Promise<string> {
    return getFirebaseAuthLazy().createCustomToken(uid, additionalClaims);
  },
  getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    return getFirebaseAuthLazy().getUserByEmail(email);
  },
  deleteUser(uid: string): Promise<void> {
    return getFirebaseAuthLazy().deleteUser(uid);
  },
  verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return getFirebaseAuthLazy().verifyIdToken(token);
  },
  createUser(
    properties: admin.auth.CreateRequest,
  ): Promise<admin.auth.UserRecord> {
    return getFirebaseAuthLazy().createUser(properties);
  },
};

export const firebaseAuth = firebaseAuthService;

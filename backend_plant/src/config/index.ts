export interface Config {
  app: {
    name: string;
    port: number;
    env: string;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    apiKey: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    bucketName: string;
  };
  plantId: {
    apiKey: string;
  };
  libreTranslate: {
    url: string;
  };
  google: {
    androidClientId: string;
  };
  storage: {
    uploadDir: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
}

function getEnv(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  _config = {
    app: {
      name: getEnv("APP_NAME", "Plant API"),
      port: parseInt(getEnv("PORT", "3000"), 10),
      env: getEnv("NODE_ENV", "development"),
    },
    firebase: {
      projectId: getEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
      clientEmail: getEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getEnv("FIREBASE_PRIVATE_KEY"),
      apiKey: getEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
      authDomain: getEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      storageBucket: getEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: getEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: getEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
    },
    supabase: {
      url: getEnv("EXPO_PUBLIC_SUPABASE_URL"),
      anonKey: getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
      serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      bucketName: "plant-images",
    },
    plantId: {
      apiKey: getEnv("EXPO_PUBLIC_PLANT_ID_API_KEY"),
    },
    libreTranslate: {
      url: getEnv("EXPO_PUBLIC_LIBRETRANSLATE_URL", "https://libretranslate.de/translate"),
    },
    google: {
      androidClientId: getEnv("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"),
    },
    storage: {
      uploadDir: getEnv("UPLOAD_DIR", "./uploads"),
      maxFileSize: parseInt(getEnv("MAX_FILE_SIZE", "10485760"), 10),
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  };

  return _config;
}

export function requireValidConfig(): Config {
  const cfg = loadConfig();
  
  if (!cfg.supabase.url) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");
  if (!cfg.supabase.anonKey) throw new Error("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY");
  if (!cfg.plantId.apiKey) throw new Error("Missing EXPO_PUBLIC_PLANT_ID_API_KEY");
  if (!cfg.google.androidClientId) throw new Error("Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID");
  
  return cfg;
}

export function getConfig(): Config {
  return loadConfig();
}

export const config = {
  get app() { return loadConfig().app; },
  get firebase() { return loadConfig().firebase; },
  get supabase() { return loadConfig().supabase; },
  get plantId() { return loadConfig().plantId; },
  get libreTranslate() { return loadConfig().libreTranslate; },
  get google() { return loadConfig().google; },
  get storage() { return loadConfig().storage; },
};
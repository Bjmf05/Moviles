import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../lib/firebase";

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === "error") {
      console.error("Error Google Auth:", response.error);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      const user = userCred.user;

      // Crear perfil en Firestore si es la primera vez
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName ?? "",
          email: user.email ?? "",
          photoURL: user.photoURL ?? null,
          birthdate: "",
          country: "",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Error al iniciar sesión con Google:", e);
    }
  };

  const authGoogle = () => {
    promptAsync().catch((e) => console.error("Error promptAsync:", e));
  };

  return { authGoogle, request };
}

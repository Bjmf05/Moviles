import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../lib/firebase";
import { api, AuthUser } from "../lib/api";

export function useGoogleAuth(
  onSuccess?: (result: { user: AuthUser; token: string }) => void,
) {
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

  const handleGoogleSignIn = async (googleIdToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCred = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCred.user.getIdToken();

      const result = await api.auth.googleLogin(firebaseIdToken);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (e) {
      console.error("Error al iniciar sesion con Google:", e);
    }
  };

  const authGoogle = () => {
    promptAsync().catch((e) => console.error("Error promptAsync:", e));
  };

  return { authGoogle, request };
}

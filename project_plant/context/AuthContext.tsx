import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api, AuthUser } from "../lib/api";

const TOKEN_KEY = "@auth_token";
const USER_KEY = "@auth_user";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    birthdate?: string,
    country?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error loading stored auth:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedUser, token: authToken } = await api.auth.login({
      email,
      password,
    });

    if (!authToken) {
      throw new Error("No token received from backend");
    }

    await AsyncStorage.setItem(TOKEN_KEY, authToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedUser));

    setToken(authToken);
    setUser(loggedUser);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      birthdate?: string,
      country?: string,
    ) => {
      const { user: newUser, token: authToken } = await api.auth.register({
        email,
        password,
        name,
        birthdate,
        country,
      });
      if (!authToken) {
        throw new Error("No token received from backend");
      }
      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(authToken);
      setUser(newUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<AuthUser>) => {
      if (!token) {
        throw new Error("No token received from backend");
      }

      await api.auth.updateProfile(token, data);

      const updatedUser = { ...user, ...data } as AuthUser;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    [token, user],
  );

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

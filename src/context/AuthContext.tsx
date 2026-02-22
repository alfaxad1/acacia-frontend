import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../services/api";
import { LoginResponse, UserData } from "../types";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await authApi.login(email, password);

      // if (response.status !== 200) {
      //   throw new Error("Login failed");
      // }

      console.log("Login response:", response);

      const accessToken = response.accessToken;

      if (accessToken) {
        localStorage.setItem(
          "expirationTime",
          response.expirationTime.toString()
        );
        localStorage.setItem("memberId", response.userData.memberId.toString());
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("role", response.userData.role);
        localStorage.setItem("userName", response.userData.name);
        localStorage.setItem("userEmail", response.userData.email);

        //navigate(from, { replace: true });
      } else {
        throw new Error("No token received");
      }

      if (!accessToken) {
        throw new Error("No token received from server");
      }

      setIsAuthenticated(true);
      setUser(response.userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

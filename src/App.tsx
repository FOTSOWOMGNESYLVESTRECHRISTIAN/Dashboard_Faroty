import { useEffect, useState, useCallback } from "react";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { authService } from "./services/authService";
import { getUserProfile, isAuthenticated as checkAuth } from "./services/tokenStorage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkAuth());
  const [user, setUser] = useState(() => getUserProfile());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    setIsAuthenticated(checkAuth());
    setUser(getUserProfile());
    setIsBootstrapping(false);
  }, []);

  const handleLogin = useCallback((userPayload?: any) => {
    setIsAuthenticated(true);
    setUser(userPayload || getUserProfile());
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  if (isBootstrapping) {
    return null;
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} user={user} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
      <Toaster />
    </>
  );
}

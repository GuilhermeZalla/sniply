import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { logout, refresh } from "./lib/api";
import type { User } from "./lib/types";
const Context = createContext<{
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}>({ user: null, loading: true, setUser: () => {}, signOut: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  const cache = useQueryClient();
  useEffect(() => {
    let active = true;
    void refresh()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => {
      setUser(null);
      cache.clear();
    };
    window.addEventListener("sniply:session-ended", expired);
    return () => {
      active = false;
      window.removeEventListener("sniply:session-ended", expired);
    };
  }, [cache]);
  async function signOut() {
    try {
      await logout();
    } finally {
      setUser(null);
      cache.clear();
    }
  }
  return (
    <Context.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);

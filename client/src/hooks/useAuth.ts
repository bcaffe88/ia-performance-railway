import { trpc } from "../lib/trpc";
import { User } from "../../drizzle/schema";
import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: Infinity,
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/";
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
      setIsAuthenticated(!!meQuery.data);
    } else if (meQuery.isError) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [meQuery.data, meQuery.isError]);

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isAuthenticated,
    isLoading: meQuery.isLoading,
    logout,
  };
}

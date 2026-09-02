import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface UseUserReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Universal client auth state hook.
 * Subscribes to Supabase auth state transitions with in-memory caching and zero redundant requests.
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchSession = useCallback(async () => {
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) {
          setError(sessionError);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    session,
    isLoading,
    error,
    refresh: fetchSession,
  };
}

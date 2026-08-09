import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client"; // Native central client
import type { Session, User } from "@supabase/supabase-js";
import { upsertRegisteredUser } from "@/lib/store";

export type UserRole = "visitor" | "member" | "admin";

export interface AppUser {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  role: UserRole;
  memberId?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_EMAILS = new Set(["njbsictclub@gmail.com"]);

export function generateMemberId() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `NJBs12134${suffix}`;
}

/**
 * Roles are decided by the account itself — never by a client-side choice:
 * - the club admin email is admin
 * - accounts created in the admin panel carry role/member_id metadata -> member
 * - everyone who signs up themselves is a visitor
 */
function resolveRole(user: User): { role: UserRole; memberId?: string } {
  const email = user.email?.toLowerCase() ?? "";
  if (ADMIN_EMAILS.has(email)) return { role: "admin", memberId: "NJBs12134-ADMIN" };

  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  if (meta.role === "member" || meta.member_id) {
    return { role: "member", memberId: meta.member_id ?? generateMemberId() };
  }

  return { role: "visitor" };
}

function toAppUser(user: User): AppUser {
  const { role, memberId } = resolveRole(user);
  const meta = user.user_metadata ?? {};
  const app: AppUser = {
    id: user.id,
    email: user.email ?? null,
    name: meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Member",
    avatar: meta.avatar_url ?? meta.picture ?? null,
    role,
    memberId,
  };
  upsertRegisteredUser({
    id: app.id,
    email: app.email ?? "",
    name: app.name,
    avatar: app.avatar,
    role: app.role,
    memberId: app.memberId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  });
  return app;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If client proxy configuration is missing valid keys, don't attempt listeners
    if (!supabase || typeof supabase.auth === "undefined") {
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, s: Session | null) => {
      setSession(s);
      setUser(s?.user ? toAppUser(s.user) : null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setUser(data.session?.user ? toAppUser(data.session.user) : null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase || typeof supabase.auth === "undefined") return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

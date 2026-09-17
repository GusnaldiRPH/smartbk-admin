"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types";

/**
 * Cek sesi login Supabase, pastikan role-nya "admin" (dari tabel profiles),
 * dan redirect ke /login kalau belum login / bukan admin.
 * Dipakai di app/admin/layout.tsx supaya semua halaman /admin/* otomatis terlindungi.
 */
export function useAdminAuth() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        if (isMounted) {
          setLoading(false);
          router.replace("/login");
        }
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!isMounted) return;

      if (error || !profileData || profileData.role !== "admin") {
        setLoading(false);
        router.replace("/login");
        return;
      }

      setProfile(profileData as Profile);
      setLoading(false);
    };

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return { profile, loading, logout };
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push("/login");
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
        <p className="text-sm text-slate-300">Redirecting to login...</p>
      </div>
    </main>
  );
}

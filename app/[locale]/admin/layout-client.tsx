"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { SessionProvider } from "next-auth/react";

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  // Check if we're on an auth page (signin, signup, etc.)
  // Using includes with trailing slash prevents false positives like /admin/authenticate
  const isAuthPage = pathname?.includes('/admin/auth/');

  useEffect(() => {
    if (status === "loading" || hasRedirectedRef.current || isAuthPage) return;

    if (!session) {
      console.log("No session, redirecting to signin");
      hasRedirectedRef.current = true;
      // Not authenticated, redirect to admin signin
      router.replace("/admin/auth/signin");
      return;
    }

    // Check if user is admin
    if (!session.user?.isAdmin) {
      console.log("User not admin, redirecting to unauthorized");
      hasRedirectedRef.current = true;
      // Not admin, redirect to unauthorized (mirrors server-side requireAdmin)
      router.replace("/unauthorized");
      return;
    }

    console.log("User authenticated and is admin");
  }, [session, status, router, isAuthPage]);

  // Show loading while checking auth
  // if (status === "loading") {
  //   return (
  //     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Show loading while redirecting (but not on auth pages)
  if (!isAuthPage && (!session || !session.user?.isAdmin)) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="p-4 bg-gray-800 text-white font-bold text-xl">Admin Panel</header>
      <main className="p-8">{children}</main>
    </div>
  );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminAuthGuard>
        {children}
      </AdminAuthGuard>
    </SessionProvider>
  );
}

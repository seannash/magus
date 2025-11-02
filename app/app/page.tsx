'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    document.title = 'Magus';
    // Check authentication status
    fetch('/api/auth/session')
      .then((res) => {
        if (res.ok) {
          // User is logged in, redirect to chat
          router.replace('/chat');
        } else {
          // User is not logged in, redirect to login
          router.replace('/login');
        }
      })
      .catch(() => {
        // Error checking session, redirect to login
        router.replace('/login');
      });
  }, [router]);

  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
      <div className="text-gray-500 dark:text-gray-400">Loading...</div>
    </div>
  );
}

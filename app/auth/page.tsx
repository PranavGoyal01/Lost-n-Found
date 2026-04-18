'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
          }
        });

        if (error) throw error;

        if (data.user) {
          router.push('/home');
        } else {
          alert("Verification email sent! Please check your inbox.");
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (data.user) {
          console.log("User found in client:", data.user);
          // Manual check: Can we see the session in local storage?
          console.log("Session exists:", !!(await supabase.auth.getSession()).data.session);
          router.push('/home');
        }

        if (error) throw error;

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('name')
            .eq('id', data.user.id)
            .single();

          // Standard redirect logic:
          // Fixed your logic here: Send to /home if name is missing
          if (!profile?.name || profileError) {
            router.push('/home');
          } else {
            router.push('/home');
          }
        }
      }
    } catch (err) {
      // Fix: Instead of (err: any), use a type check or cast as Error
      const message = err instanceof Error ? err.message : "An error occurred during authentication";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-4xl font-bold mb-2 tracking-tighter text-black">Lost&Found</h1>
      <p className="mb-8 text-gray-600">You saw someone. We will find them.</p>

      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-sm">
        <div className="flex gap-4 mb-6 border-b pb-2">
          <button
            type="button"
            className={`font-bold transition-colors ${!isSignUp ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
            onClick={() => setIsSignUp(false)}
          >
            Log In
          </button>
          <button
            type="button"
            className={`font-bold transition-colors ${isSignUp ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-gray-700">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="border p-3 rounded w-full mt-1 bg-gray-50 text-black"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="border p-3 rounded w-full mt-1 bg-gray-50 text-black"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white p-3 rounded-lg font-bold mt-2 disabled:opacity-50 hover:bg-gray-800 transition-all"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}
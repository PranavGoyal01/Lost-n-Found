'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
          },
        });

        if (error) throw error;

        if (data.user) {
          router.push('/home');
        } else {
          alert('Verification email sent! Please check your inbox.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('name')
            .eq('id', data.user.id)
            .single();

          if (!profile?.name || profileError) {
            router.push('/home');
          } else {
            router.push('/home');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link href="/" className="text-[15px] font-medium tracking-tight text-gray-900">
          Lost&amp;Found
        </Link>
      </nav>

      {/* Auth card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* Header */}
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4 text-center">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
          <h1
            className="text-[32px] font-normal tracking-tight text-center text-gray-900 mb-8 leading-tight"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            {isSignUp ? 'Start your search.' : 'Sign back in.'}
          </h1>

          {/* Toggle */}
          <div className="flex gap-0 mb-8 border border-gray-200 rounded-lg p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 text-[13px] font-medium py-2 rounded-md transition-all ${
                !isSignUp
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-400'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 text-[13px] font-medium py-2 rounded-md transition-all ${
                isSignUp
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-400'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="w-full text-[14px] px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full text-[14px] px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-[14px] font-medium py-3 rounded-lg mt-2 hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {loading ? 'One moment…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[12px] text-gray-400 mt-6">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-gray-600 underline underline-offset-2"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                No account yet?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-gray-600 underline underline-offset-2"
                >
                  Sign up free
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-8 py-5 border-t border-gray-100">
        <span className="text-[12px] text-gray-400">© 2025 Lost&amp;Found</span>
        <div className="flex gap-5">
          {['Privacy', 'Terms'].map((link) => (
            <Link
              key={link}
              href={`/${link.toLowerCase()}`}
              className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              {link}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.signInWithOtp({ phone });
    alert('Code sent!');
    router.push('/onboarding');
  };

  return (
    <form onSubmit={handleLogin} className="p-8 max-w-sm mx-auto">
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="border p-2 w-full mb-4" />
      <button type="submit" className="w-full bg-black text-white p-2">Send Code</button>
    </form>
  );
}
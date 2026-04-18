'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [data, setData] = useState({ name: '', age: '', likes: '' });
  const router = useRouter();

  const saveProfile = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify(data)
    });
    router.push('/home');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl">Setup Profile</h1>
      <input placeholder="Name" onChange={e => setData({...data, name: e.target.value})} className="border p-2 block w-full my-2" />
      <input placeholder="Age" type="number" onChange={e => setData({...data, age: e.target.value})} className="border p-2 block w-full my-2" />
      <textarea placeholder="Likes/Interests" onChange={e => setData({...data, likes: e.target.value})} className="border p-2 block w-full my-2" />
      <button onClick={saveProfile} className="bg-blue-600 text-white p-2 mt-4">Complete Setup</button>
    </div>
  );
}
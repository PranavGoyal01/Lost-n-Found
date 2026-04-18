'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NewMoment() {
  const router = useRouter();
  const [form, setForm] = useState({ description: '', date: '', time: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch('/api/moments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.status === 'similar_found') router.push('/matches');
    else router.push('/moments');
  };

  return (
    <form onSubmit={submit} className="p-8 flex flex-col gap-4 max-w-md mx-auto">
      <input type="date" onChange={e => setForm({...form, date: e.target.value})} className="border p-2" required/>
      <input type="time" onChange={e => setForm({...form, time: e.target.value})} className="border p-2" required/>
      <textarea placeholder="Describe them, you, and the interaction..." onChange={e => setForm({...form, description: e.target.value})} className="border p-2 h-32" required/>
      <button type="submit" className="bg-black text-white p-2">Find Them</button>
    </form>
  );
}
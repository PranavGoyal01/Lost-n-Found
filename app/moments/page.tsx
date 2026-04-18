// app/moments/page.tsx

'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Moment } from '@/app/types';

export default function Moments() {
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    const fetchMoments = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch('/api/moments', { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
      setMoments(await res.json());
    };
    fetchMoments();
  }, []);

  const deleteMoment = async (id: string) => {
    const session = (await supabase.auth.getSession()).data.session;
    await fetch(`/api/moments/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session?.access_token}` } });
    setMoments(moments.filter(m => m.id !== id));
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl mb-4">My Listed Moments</h1>
      {moments.map(m => (
        <details key={m.id} className="border p-4 mb-2">
          <summary className="font-bold cursor-pointer">{new Date(m.event_time).toLocaleDateString()}</summary>
          <p className="mt-2">{m.description}</p>
          <button onClick={() => deleteMoment(m.id)} className="text-red-500 text-sm mt-4">Delete / Edit</button>
        </details>
      ))}
    </div>
  );
}
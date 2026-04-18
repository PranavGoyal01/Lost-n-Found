'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Moment } from '@/app/types';

export default function NewMoment() {
  const router = useRouter();
  const [form, setForm] = useState({ description: '', date: '', time: '' });
  const [loading, setLoading] = useState(false);
  
  // New state for the "menu" view
  const [potentials, setPotentials] = useState<Moment[]>([]);
  const [currentMomentId, setCurrentMomentId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const session = (await supabase.auth.getSession()).data.session;
    
    const res = await fetch('/api/moments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify(form)
    });
    
    const data = await res.json();
    setLoading(false);

    if (data.status === 'similar_found') {
      // Switch to the potentials menu
      setPotentials(data.matches);
      setCurrentMomentId(data.moment.id);
    } else {
      router.push('/moments');
    }
  };

  const confirmMatch = async (otherPostId: string) => {
    const session = (await supabase.auth.getSession()).data.session;
    await fetch('/api/confirmations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({
        current_post_id: currentMomentId,
        other_post_id: otherPostId
      })
    });
    // Redirect to matches after they confirm!
    router.push('/matches');
  };

  // If we found similar vectors, show the menu instead of the form
  if (potentials.length > 0) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">Are any of these them?</h2>
        <p className="mb-6 text-gray-600">We found some similar moments. Take a look:</p>
        
        <div className="space-y-4">
          {potentials.map((p, idx) => (
            <div key={idx} className="border p-4 rounded-lg bg-white shadow-sm">
              <p className="text-gray-800 mb-4 italic">{p.description}</p>
              <button 
                onClick={() => confirmMatch(p.id)}
                className="w-full bg-black text-white p-2 rounded font-semibold hover:bg-gray-800 transition"
              >
                Yes, this is who I am looking for
              </button>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => router.push('/matches')}
          className="mt-6 w-full text-center text-gray-500 underline"
        >
          None of these are them (skip for now)
        </button>
      </div>
    );
  }

  // Standard Form View
  return (
    <form onSubmit={submit} className="p-8 flex flex-col gap-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Post a Moment</h1>
      <input type="date" onChange={e => setForm({...form, date: e.target.value})} className="border p-2 rounded" required/>
      <input type="time" onChange={e => setForm({...form, time: e.target.value})} className="border p-2 rounded" required/>
      <textarea placeholder="Describe them, you, and the interaction..." onChange={e => setForm({...form, description: e.target.value})} className="border p-2 h-32 rounded" required/>
      <button type="submit" disabled={loading} className="bg-black text-white p-2 rounded disabled:bg-gray-400">
        {loading ? 'Searching...' : 'Find Them'}
      </button>
    </form>
  );
}
'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MomentFormData {
  location: string;
  date: string;
  time: string;
  myLook: string;
  theirLook: string;
  interaction: string;
}

export default function NewMoment() {
  const router = useRouter();
  const [formData, setFormData] = useState<MomentFormData>({
    location: '', date: '', time: '', myLook: '', theirLook: '', interaction: ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/auth');

    const response = await fetch('/api/moments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(formData)
    });
    
    if(response.ok) {
      const data = await response.json();
      if (data.status === 'potential_matches_found') {
        alert("We found some potential matches! Redirecting to confirmations...");
        router.push('/matches');
      } else {
        alert("We're looking. We'll notify you if we find a match.");
        router.push('/home');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">I Saw Someone</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <input 
          type="text" name="location" placeholder="📍 Where? (e.g., Joe's Coffee)" 
          className="border p-3 rounded bg-gray-50" required
          onChange={handleChange}
        />
        
        <div className="flex gap-3">
          <input type="date" name="date" className="border p-3 rounded w-full bg-gray-50" required
            onChange={handleChange} />
          <input type="time" name="time" className="border p-3 rounded w-full bg-gray-50" required
            onChange={handleChange} />
        </div>

        <textarea 
          name="myLook" placeholder="What were you wearing?" 
          className="border p-3 rounded h-24 bg-gray-50" required
          onChange={handleChange}
        />

        <textarea 
          name="theirLook" placeholder="What were they wearing? Hair? Features?" 
          className="border p-3 rounded h-24 bg-gray-50" required
          onChange={handleChange}
        />

        <textarea 
          name="interaction" placeholder="Describe the interaction (Eye contact? Passed by?)" 
          className="border p-3 rounded h-24 bg-gray-50" required
          onChange={handleChange}
        />

        <button type="submit" className="bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 transition-colors">
          Find Them
        </button>
      </form>
    </div>
  );
}
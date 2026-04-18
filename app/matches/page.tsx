'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MatchRecord } from '@/app/types';

export default function Matches() {
  // Fix: Specify the type for the array
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      try {
        const res = await fetch('/api/matches', { 
          headers: { 'Authorization': `Bearer ${session.access_token}` } 
        });
        
        if (res.ok) {
          const data: MatchRecord[] = await res.json();
          setMatches(data);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading) return <div className="p-8 text-center">Finding matches...</div>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Matches</h1>
      
      {matches.length === 0 ? (
        <p className="text-gray-500">No matches yet. Keep an eye out!</p>
      ) : (
        matches.map((m) => (
          <details key={m.id} className="border p-4 mb-2 bg-green-50 rounded-lg overflow-hidden">
            <summary className="font-bold cursor-pointer text-green-800">
              Match Found! Chat ID: {m.chat_id}
            </summary>
            <div className="mt-2 text-sm text-gray-700 space-y-3">
              <div className="p-2 bg-white rounded border">
                <strong>You wrote:</strong> 
                <p>{m.moments_a?.description}</p>
              </div>
              
              <div className="p-2 bg-white rounded border">
                <strong>They wrote:</strong> 
                <p>{m.moments_b?.description}</p>
              </div>
              
              <p className="mt-4 font-semibold text-blue-600">
                Connect via SMS/Photon!
              </p>
            </div>
          </details>
        ))
      )}
    </div>
  );
}
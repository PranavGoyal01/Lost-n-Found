'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MatchRecord } from '@/app/types';

// Let's add a quick type for the pending records
type PendingRecord = {
  id: string;
  moment_a_id: string;
  moment_b_id: string;
  user_a_confirmed: boolean;
  user_b_confirmed: boolean;
  user_a_id: string;
  user_b_id: string;
  moments_a?: { description: string };
  moments_b?: { description: string };
};

export default function Matches() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [pending, setPending] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);

      try {
        // 1. Fetch fully confirmed matches
        const res = await fetch('/api/matches', { 
          headers: { 'Authorization': `Bearer ${session.access_token}` } 
        });
        if (res.ok) {
          const data: MatchRecord[] = await res.json();
          setMatches(data);
        }

        // 2. Fetch pending confirmations
        const { data: pendingData } = await supabase
          .from('confirmations')
          .select('*, moments_a:moment_a_id(description), moments_b:moment_b_id(description)')
          .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`);
        
        if (pendingData) {
          // Filter out ones that are already fully matched (both confirmed)
          const onlyPending = pendingData.filter(p => !(p.user_a_confirmed && p.user_b_confirmed));
          setPending(onlyPending);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const acceptPendingMatch = async (currentPostId: string, otherPostId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/confirmations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ current_post_id: currentPostId, other_post_id: otherPostId })
    });
    // Refresh to show it moved to matches
    window.location.reload();
  };

  if (loading) return <div className="p-8 text-center">Loading your connections...</div>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Connections</h1>

      {/* --- PENDING SECTION --- */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Pending Confirmations</h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending connections right now.</p>
        ) : (
          pending.map((p) => {
            const isUserA = p.user_a_id === currentUserId;
            // If you are User A, you are waiting on B. If you are B, you are waiting on A.
            const waitingOnThem = isUserA ? p.user_a_confirmed : p.user_b_confirmed;
            
            // Get the IDs straight for the accept button
            const myPostId = isUserA ? p.moment_a_id : p.moment_b_id;
            const theirPostId = isUserA ? p.moment_b_id : p.moment_a_id;
            const theirDescription = isUserA ? p.moments_b?.description : p.moments_a?.description;

            return (
              <div key={p.id} className="border p-4 mb-3 bg-yellow-50 rounded-lg shadow-sm">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  {waitingOnThem ? "⏳ Waiting for their response..." : "✨ They think you're a match!"}
                </p>
                <div className="p-3 bg-white rounded border text-sm text-gray-700">
                  <strong>Their Moment:</strong>
                  <p className="mt-1 italic">{theirDescription}</p>
                </div>
                
                {/* If we aren't waiting on them, it means THEY confirmed us, so we show the Accept button */}
                {!waitingOnThem && (
                  <button 
                    onClick={() => acceptPendingMatch(myPostId, theirPostId)}
                    className="mt-3 w-full bg-black text-white p-2 rounded font-semibold hover:bg-gray-800 transition"
                  >
                    Accept Match
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
      
      {/* --- MATCHES SECTION --- */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Confirmed Matches</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-sm">No matches yet. Keep an eye out!</p>
        ) : (
          matches.map((m) => (
            <details key={m.id} className="border p-4 mb-3 bg-green-50 rounded-lg overflow-hidden shadow-sm">
              <summary className="font-bold cursor-pointer text-green-800">
                🎉 Match Found! Chat ID: {m.chat_id}
              </summary>
              <div className="mt-3 text-sm text-gray-700 space-y-3">
                <div className="p-3 bg-white rounded border">
                  <strong>You wrote:</strong> 
                  <p className="mt-1 italic">{m.moments_a?.description}</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <strong>They wrote:</strong> 
                  <p className="mt-1 italic">{m.moments_b?.description}</p>
                </div>
                <button className="w-full mt-2 bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700 transition">
                  Connect via SMS/Photon
                </button>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
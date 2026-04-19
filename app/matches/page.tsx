"use client";
import { MatchRecord } from "@/app/types";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from 'next/link';
import Avatar from '@/app/components/Avatar';

// In Matches.tsx

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
  // ✨ Add these two lines so TypeScript knows about the profiles!
  users_a?: { name: string; profile_picture: string | null };
  users_b?: { name: string; profile_picture: string | null };
};

export default function Matches() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [pending, setPending] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

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
          .select(`
            *,
            moments_a:moment_a_id(description),
            moments_b:moment_b_id(description),
            users_a:user_a_id(name, profile_picture),
            users_b:user_b_id(name, profile_picture)
          `)
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

  const acceptPendingMatch = async (pendingId: string, currentPostId: string, otherPostId: string) => {
    setAcceptingId(pendingId);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/confirmations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ current_post_id: currentPostId, other_post_id: otherPostId }),
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-[15px] font-medium tracking-tight text-gray-900">Lost&amp;Found</span>
        <Link href="/home" className="text-[13px] text-gray-400 hover:text-gray-700 transition-colors">Home</Link>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4">Connections</p>
            <h1
              className="text-[32px] font-normal tracking-tight text-gray-900 leading-tight"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              My matches
            </h1>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-5 animate-pulse">
                  <div className="h-2.5 bg-gray-100 rounded w-1/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Pending */}
              {pending.length > 0 && (
                <div className="mb-8">
                  <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4">
                    Pending
                  </p>
                  <div className="flex flex-col gap-3">
                    {pending.map((p) => {
                      const isUserA = p.user_a_id === currentUserId;
                      const waitingOnThem = isUserA ? p.user_a_confirmed : p.user_b_confirmed;
                      const myPostId = isUserA ? p.moment_a_id : p.moment_b_id;
                      const theirPostId = isUserA ? p.moment_b_id : p.moment_a_id;
                      const theirDescription = isUserA ? p.moments_b?.description : p.moments_a?.description;

                      const theirPic = isUserA ? p.users_b?.profile_picture : p.users_a?.profile_picture;
                      const theirName = isUserA ? p.users_b?.name : p.users_a?.name;

                      return (
                        <div key={p.id} className="border border-gray-200 rounded-lg p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar src={theirPic} name={theirName} size={40} />
                            <p className="text-[14px] font-medium text-gray-900">{theirName ?? 'Someone'}</p>
                          </div>
                          <p className="text-[11px] font-medium tracking-wide uppercase mb-3 text-gray-400">
                            {waitingOnThem ? 'Awaiting their response' : 'They think it\'s you'}
                          </p>
                          <p className="text-[14px] text-gray-600 leading-relaxed italic mb-4">
                            &ldquo;{theirDescription}&rdquo;
                          </p>
                          {!waitingOnThem && (
                            <button
                              onClick={() => acceptPendingMatch(p.id, myPostId, theirPostId)}
                              disabled={acceptingId === p.id}
                              className="w-full bg-gray-900 text-white text-[13px] font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                            >
                              {acceptingId === p.id ? 'Accepting…' : 'Accept match'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirmed matches */}
              <div>
                {pending.length > 0 && (
                  <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4">
                    Confirmed
                  </p>
                )}
                {matches.length === 0 && pending.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-[15px] text-gray-400 mb-2">No matches yet.</p>
                    <p className="text-[13px] text-gray-300">Keep an eye out.</p>
                  </div>
                ) : matches.length === 0 ? (
                  <p className="text-[14px] text-gray-400">No confirmed matches yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {matches.map((m) => {
                      // ✨ 1. Figure out who is who (so you don't show your own face/name)
                      const isUserA = m.user_a_id === currentUserId;
                      const theirName = isUserA ? m.users_b?.name : m.users_a?.name;
                      const theirPic = isUserA ? m.users_b?.profile_picture : m.users_a?.profile_picture;

                      // ✨ 2. Figure out who wrote which description
                      const myDescription = isUserA ? m.moments_a?.description : m.moments_b?.description;
                      const theirDescription = isUserA ? m.moments_b?.description : m.moments_a?.description;

                      return (
                        <div key={m.id} className="border border-gray-200 rounded-lg p-5">

                          {/* ✨ 3. The newly added Avatar Header! */}
                          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                            <Avatar src={theirPic} name={theirName} size={40} />
                            <div>
                              <p className="text-[11px] font-medium tracking-wide uppercase text-gray-400">Matched with</p>
                              <p className="text-[14px] font-medium text-gray-900">{theirName ?? 'Someone'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 mb-2">
                            <div>
                              <p className="text-[11px] text-gray-400 mb-1">You wrote</p>
                              <p className="text-[14px] text-gray-700 leading-relaxed italic">
                                &ldquo;{myDescription}&rdquo;
                              </p>
                            </div>
                            <div className="border-t border-gray-100 pt-3">
                              <p className="text-[11px] text-gray-400 mb-1">They wrote</p>
                              <p className="text-[14px] text-gray-700 leading-relaxed italic">
                                &ldquo;{theirDescription}&rdquo;
                              </p>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Moment } from '@/app/types';
import Link from 'next/link';
import { RPCMatchResult } from "@/app/types"; // make sure to import it

export default function Moments() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoments = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch('/api/moments', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setMoments(await res.json());
      setLoading(false);
    };
    fetchMoments();
  }, []);

  const deleteMoment = async (id: string) => {
    setDeletingId(id);
    const session = (await supabase.auth.getSession()).data.session;
    await fetch(`/api/moments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setMoments((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-[15px] font-medium tracking-tight text-gray-900">Lost&amp;Found</span>
        <Link href="/home" className="text-[13px] text-gray-400 hover:text-gray-700 transition-colors">
          Home
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4">
              Your history
            </p>
            <h1
              className="text-[32px] font-normal tracking-tight text-gray-900 leading-tight"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              My moments
            </h1>
          </div>

          {/* States */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : moments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[15px] text-gray-400 mb-6">No moments posted yet.</p>
              <Link
                href="/moments/new"
                className="bg-gray-900 text-white text-[14px] font-medium px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Post your first moment
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {moments.map((m) => (
                <div key={m.id} className="border border-gray-200 rounded-lg p-5">
                  <p className="text-[11px] font-medium tracking-wide uppercase text-gray-400 mb-2">
                    {new Date(m.event_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[14px] text-gray-700 leading-relaxed">{m.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => deleteMoment(m.id)}
                      disabled={deletingId === m.id}
                      className="text-[12px] text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      {deletingId === m.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Post another */}
          {!loading && moments.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href="/moments/new"
                className="text-[13px] text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4"
              >
                Post another moment
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types';
import Link from 'next/link';
import ProfilePictureUpload from '@/app/components/ProfilePictureUpload';

const inputClass = "w-full text-[14px] px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors";
const labelClass = "block text-[12px] font-medium text-gray-500 mb-1.5";
const textareaClass = "w-full text-[14px] px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors min-h-[96px] resize-y";

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const router = useRouter();
  const isInitialMount = useRef(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      const res = await fetch(`/api/users?id=${session.user.id}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data: UserProfile = await res.json();
      setProfile(data);
      setEditForm(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isInitialMount.current) { fetchProfile(); isInitialMount.current = false; }
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setIsEditing(false); await fetchProfile(); }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <span className="text-[15px] font-medium tracking-tight text-gray-900">Lost&amp;Found</span>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-gray-400 animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <p className="text-[14px] text-gray-400">Profile not found.</p>
      </div>
    );
  }

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
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4">Account</p>
            <h1
              className="text-[32px] font-normal tracking-tight text-gray-900 leading-tight"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              Your profile
            </h1>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-10">
            <ProfilePictureUpload
              userId={profile.id}
              currentPictureUrl={profile.profile_picture || null}
              onUploadSuccess={(newUrl) => setProfile({ ...profile, profile_picture: newUrl })}
            />
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  className={inputClass}
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  className={inputClass}
                  value={editForm.phone_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  placeholder="+1 000 000 0000"
                />
              </div>
              <div>
                <label className={labelClass}>Age</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  className={inputClass}
                  value={editForm.age ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    const parsed = Number.parseInt(raw, 10);
                    setEditForm({ ...editForm, age: raw === '' || Number.isNaN(parsed) ? null : parsed });
                  }}
                  placeholder="e.g. 24"
                />
              </div>
              <div>
                <label className={labelClass}>Likes</label>
                <textarea
                  className={textareaClass}
                  value={editForm.likes || ''}
                  onChange={(e) => setEditForm({ ...editForm, likes: e.target.value })}
                  placeholder="Coffee, hikes, indie music, art museums..."
                />
              </div>
              <div>
                <label className={labelClass}>Dislikes</label>
                <textarea
                  className={textareaClass}
                  value={editForm.dislikes || ''}
                  onChange={(e) => setEditForm({ ...editForm, dislikes: e.target.value })}
                  placeholder="Crowded bars, spicy food, early mornings..."
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white text-[14px] font-medium py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditForm(profile); }}
                  className="flex-1 border border-gray-200 text-[14px] text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Fields */}
              <div className="flex flex-col gap-0 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                {[
                  { label: 'Name', value: profile.name || 'Not set' },
                  { label: 'Email', value: profile.email },
                  { label: 'Phone', value: profile.phone_number || 'Not set' },
                  { label: 'Age', value: profile.age ?? 'Not set' },
                  { label: 'Likes', value: profile.likes || 'Not set' },
                  { label: 'Dislikes', value: profile.dislikes || 'Not set' },
                ].map((field) => (
                  <div key={field.label} className="px-4 py-3.5">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{field.label}</p>
                    <p className="text-[14px] text-gray-800">{field.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gray-900 text-white text-[14px] font-medium py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Edit profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-[13px] text-gray-400 hover:text-red-500 transition-colors py-1"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
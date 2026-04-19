// app/profile/page.tsx
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types';

// 👇 Import the uploader component we just built
import ProfilePictureUpload from '@/app/components/ProfilePictureUpload';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  const router = useRouter();
  
  // Guard to prevent updates if the component unmounts or before it's ready
  const isInitialMount = useRef(true);

  const fetchProfile = useCallback(async () => {
    try {
      // Use getSession for a quicker, more reliable check in effects
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      const res = await fetch(`/api/users?id=${session.user.id}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      
      const data: UserProfile = await res.json();
      
      // Update state only if we aren't in a racing condition
      setProfile(data);
      setEditForm(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Only run the fetch once on mount
    if (isInitialMount.current) {
      fetchProfile();
      isInitialMount.current = false;
    }
  }, [fetchProfile]);

  const handleSave = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      // Note: Ensure your API route is /api/users/
      const res = await fetch('/api/users', { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setIsEditing(false);
        await fetchProfile();
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-black">
        <p className="animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) return <div className="p-8 text-center text-black">Profile not found.</div>;

  return (
    <div className="p-8 max-w-md mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="p-6 border rounded-xl bg-white shadow-md space-y-4">
        
        {/* ✨ THE NEW PROFILE PICTURE SECTION ✨ */}
        <div className="border-b pb-6 mb-4">
          <ProfilePictureUpload 
            userId={profile.id} 
            currentPictureUrl={profile.profile_picture || null} 
            onUploadSuccess={(newUrl) => {
              // Update local state instantly so the UI reflects the new image
              setProfile({ ...profile, profile_picture: newUrl });
            }}
          />
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">NAME</label>
              <input 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">PHONE</label>
              <input 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editForm.phone_number || ''}
                onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSave} 
                className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all"
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="flex-1 border py-3 rounded-lg font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="border-b pb-2">
                <span className="text-xs text-gray-400 font-bold">NAME</span>
                <p className="text-lg font-medium">{profile.name || 'Not set'}</p>
              </div>
              <div className="border-b pb-2">
                <span className="text-xs text-gray-400 font-bold">EMAIL</span>
                <p className="text-lg font-medium">{profile.email}</p>
              </div>
              <div className="border-b pb-2">
                <span className="text-xs text-gray-400 font-bold">PHONE</span>
                <p className="text-lg font-medium">{profile.phone_number || 'Not set'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={() => setIsEditing(true)} 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                Edit Profile
              </button>
              <button 
                onClick={handleSignOut} 
                className="w-full text-red-600 font-bold py-2 text-sm hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
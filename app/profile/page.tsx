'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const router = useRouter();

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data: UserProfile = await res.json();
      setProfile(data);
      setEditForm(data); // Sync form with fetched data
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      const res = await fetch('/api/users/', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setIsEditing(false);
        await fetchProfile(); // Refresh data
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

  if (loading && !profile) return <div className="p-8 text-center text-black">Loading...</div>;
  if (!profile) return <div className="p-8 text-center text-black">Profile not found.</div>;

  return (
    <div className="p-8 max-w-md mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      
      <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Name</label>
              <input 
                className="w-full border p-2 rounded"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Phone</label>
              <input 
                className="w-full border p-2 rounded"
                value={editForm.phone_number || ''}
                onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSave}
                className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 border py-2 rounded font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Phone:</strong> {profile.phone_number || 'Not set'}</p>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-600 border border-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 text-sm font-medium"
              >
                Edit Profile
              </button>
              <button 
                onClick={handleSignOut}
                className="bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
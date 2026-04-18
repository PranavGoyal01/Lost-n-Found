'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types'; // Import your interface

export default function Profile() {
  // Use the interface instead of any. Initialize as null for safety.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      router.replace('/auth');
    }
  };

  if (loading) return <div className="p-8 text-center text-black">Loading...</div>;
  
  // Guard clause for type safety: if profile is null, show error or redirect
  if (!profile) return <div className="p-8 text-center text-black">Profile not found.</div>;

  return (
    <div className="p-8 max-w-md mx-auto text-black">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      
      <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
        <div className="space-y-2">
          {/* Now TypeScript knows exactly what 'name' and 'email' are */}
          <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone_number || 'Not set'}</p>
        </div>
        
        <div className="mt-6 flex flex-col gap-3">
          <button 
            type="button"
            className="text-blue-600 border border-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Edit Profile
          </button>
          
          <button 
            type="button"
            onClick={handleSignOut}
            className="bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
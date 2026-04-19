'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  userId: string;
  currentPictureUrl: string | null;
  onUploadSuccess?: (newUrl: string) => void;
}

export default function ProfilePictureUpload({ userId, currentPictureUrl, onUploadSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPictureUrl);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const files = event.target.files;
      if (!files || files.length === 0) throw new Error('You must select an image to upload.');
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      if (!fileExt) throw new Error('Invalid file format.');
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('profile-pictures').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('users').update({ profile_picture: publicUrl }).eq('id', userId);
      if (updateError) throw updateError;
      setPreviewUrl(publicUrl);
      onUploadSuccess?.(publicUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('Error uploading avatar: ' + message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Upload trigger */}
      <label
        htmlFor="avatar-upload"
        className={`text-[13px] font-medium text-gray-500 underline underline-offset-4 cursor-pointer hover:text-gray-900 transition-colors ${uploading ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {uploading ? 'Uploading…' : 'Change photo'}
      </label>
      <input id="avatar-upload" type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
    </div>
  );
}
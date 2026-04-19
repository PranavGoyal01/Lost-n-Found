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

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Using a timestamp prevents caching issues if they upload a new pic with the same name
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // 1. Upload the image to the 'profile-pictures' bucket
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the newly uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // 3. Update the users table with the new URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 4. Update the local UI
      setPreviewUrl(publicUrl);
      if (onUploadSuccess) onUploadSuccess(publicUrl);

    } catch (error: any) {
      console.error("Error uploading avatar:", error.message);
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Preview */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="relative">
        <label 
          htmlFor="avatar-upload" 
          className={`cursor-pointer bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? 'Uploading...' : 'Change Picture'}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer hidden"
        />
      </div>
    </div>
  );
}
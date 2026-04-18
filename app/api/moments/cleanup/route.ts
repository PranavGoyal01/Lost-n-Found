import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Requires a secure cron secret in production
  await supabase.from('moments').delete().lt('expires_at', new Date().toISOString());
  return NextResponse.json({ message: 'Cleanup complete' });
}
// app/api/matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // 1. Grab the token and verify the user
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Securely fetch ONLY this user's matches
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      moments_a:moment_a_id (description),
      moments_b:moment_b_id (description)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }

  // 3. Send them back to the client
  return NextResponse.json(matches);
}
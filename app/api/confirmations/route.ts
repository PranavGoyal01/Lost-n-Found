// app/api/confirmations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { current_post_id, other_post_id } = await req.json();

  // 1. Verify similarity > 0.7 still holds
  // 2. Check pending confirmation
  const { data: existing } = await supabase.from('confirmations')
    .select('*').or(`moment_a_id.eq.${current_post_id},moment_b_id.eq.${current_post_id}`).single();

  if (existing) {
    // Write true on their side
    const isUserA = existing.user_a_id === user.id;
    await supabase.from('confirmations').update({
      [isUserA ? 'user_a_confirmed' : 'user_b_confirmed']: true
    }).eq('id', existing.id);

    // If both true, create Match
    const { data: updated } = await supabase.from('confirmations').select('*').eq('id', existing.id).single();
    if (updated.user_a_confirmed && updated.user_b_confirmed) {
      await supabase.from('matches').insert([{
        user_a_id: updated.user_a_id, user_b_id: updated.user_b_id,
        moment_a_id: updated.moment_a_id, moment_b_id: updated.moment_b_id
      }]);
    }
  } else {
    // Fetch the other user's ID
    const { data: otherPost } = await supabase.from('moments').select('user_id').eq('id', other_post_id).single();
    
    await supabase.from('confirmations').insert([{
      user_a_id: user.id, user_b_id: otherPost?.user_id,
      moment_a_id: current_post_id, moment_b_id: other_post_id,
      user_a_confirmed: true, confidence_score: 0.85 // Mocked score
    }]);
  }
  return NextResponse.json({ success: true });
}
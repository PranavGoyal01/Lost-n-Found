import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { vectorizeString } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { description, date, time } = await req.json();
  const event_time = `${date}T${time}:00Z`;

  const embedding = await vectorizeString(description);

  // Search for matches
  const { data: similar } = await supabase.rpc('match_moments', {
    query_embedding: embedding, match_threshold: 0.7, match_count: 5
  });

  const { data: newMoment } = await supabase.from('moments').insert([{
    user_id: user.id, event_time, description, description_embedding: embedding
  }]).select().single();

  if (similar && similar.length > 0) {
    // Return up to top X cases
    return NextResponse.json({ status: 'similar_found', matches: similar });
  }

  return NextResponse.json({ status: 'saved', moment: newMoment });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: moments } = await supabase.from('moments').select('*').eq('user_id', user.id);
  return NextResponse.json(moments);
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  
  const { data: matches } = await supabase.from('matches')
    .select('*, moments!moment_a_id(*), moments!moment_b_id(*), users!user_a_id(name, phone_number), users!user_b_id(name, phone_number)')
    .or(`user_a_id.eq.${user?.id},user_b_id.eq.${user?.id}`);
    
  return NextResponse.json(matches);
}
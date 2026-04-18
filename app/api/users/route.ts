// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const { data } = await supabase.from('users').select('name, profile_picture').eq('id', id).single();
  return NextResponse.json(data);
}

// app/api/users/me/route.ts
export async function PUT(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  const body = await req.json();
  
  await supabase.from('users').update(body).eq('id', user?.id);
  return NextResponse.json({ success: true });
}
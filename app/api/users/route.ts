// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Add email and phone_number to the select query
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone_number, age, likes, dislikes, profile_picture')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// app/api/users/route.ts
export async function PUT(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  const body = await req.json();
  
  await supabase.from('users').update(body).eq('id', user?.id);
  return NextResponse.json({ success: true });
}
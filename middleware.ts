import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // This refreshes the session if it's expired
  const { data: { user } } = await supabase.auth.getUser();

  const isLandingPage = request.nextUrl.pathname === '/';
  const isAuthPage = request.nextUrl.pathname === '/auth';

  // Define protected routes
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/home') || 
    request.nextUrl.pathname.startsWith('/moments') ||
    request.nextUrl.pathname.startsWith('/matches') ||
    request.nextUrl.pathname.startsWith('/profile');

  // 1. If not logged in and trying to access protected content -> Send to Landing (/)
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. If already logged in and hitting Landing or Auth -> Send to Home
  if (user && (isLandingPage || isAuthPage)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  // Matches all routes except static files, images, and API routes (which handle their own auth)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
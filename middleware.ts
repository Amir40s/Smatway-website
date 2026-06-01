import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
    '/',
    '/how-it-works',
    '/signin',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/api',
    '/_next',
    '/favicon.ico',
];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 1. Allow public paths, including the marketing pages and landing page.
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return NextResponse.next();
    }

    // 2. Check for the access token in cookies
    const accessToken = req.cookies.get('access_token')?.value;

    console.log(`[Root Middleware] Accessing route: ${pathname}`);
    if (!accessToken) {
        console.warn(`[Root Middleware] No access_token cookie found. Redirecting to /signin`);
        const url = new URL('/signin', req.url);
        return NextResponse.redirect(url);
    }

    // 3. Optional: Verify the token with the API
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';
        console.log(`[Root Middleware] Found token cookie. Verifying against API: ${apiBase}/auth/me`);
        
        const res = await fetch(`${apiBase}/auth/me`, {
            headers: { Cookie: `access_token=${accessToken}` },
        });

        console.log(`[Root Middleware] API /auth/me status: ${res.status}`);

        if (!res.ok) {
            console.warn(`[Root Middleware] API verification failed. Redirecting to /signin`);
            return NextResponse.redirect(new URL('/signin', req.url));
        }

        console.log(`[Root Middleware] Verification successful! Allowing access.`);
        return NextResponse.next();
    } catch (error) {
        console.error(`[Root Middleware] API error or connection failure:`, error);
        // If the API is unreachable, we redirect to signin for safety
        return NextResponse.redirect(new URL('/signin', req.url));
    }
}

export const config = {
    // Match all request paths except for static files and images
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
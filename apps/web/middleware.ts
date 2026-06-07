import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that never require authentication.
const PUBLIC_EXACT: Set<string> = new Set([
    '/',
    '/how-it-works',
    '/signin',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/terms',
    '/privacy',
    '/imprint',
    '/transporter-code-of-conduct',
    '/traveller-code-of-conduct',
]);


const PUBLIC_PREFIXES = ['/api', '/_next', '/favicon'];

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_EXACT.has(pathname)) return true;
    return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always let marketing + auth pages through — no token required.
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // Protected route: require a valid access_token cookie.
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
        const url = new URL('/signin', req.url);
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
    }

    // Verify the token against the API.
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';
        const res = await fetch(`${apiBase}/auth/me`, {
            headers: { Cookie: `access_token=${accessToken}` },
        });
        if (!res.ok) {
            const url = new URL('/signin', req.url);
            url.searchParams.set('from', pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    } catch {
        // If the API is temporarily unreachable, let the request through —
        // the client-side DashboardLayout will handle re-auth gracefully.
        return NextResponse.next();
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

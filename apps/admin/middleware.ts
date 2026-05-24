import { NextRequest, NextResponse } from "next/server";

// Define protected routes that require admin role
const adminRoutes = ["/dashboard"];
const authRoutes = ["/login"];
const publicRoutes = ["/", "/unauthorized"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow auth routes (login, signup, etc.)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for admin role on protected routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const accessToken = request.cookies.get('access_token')?.value;

    console.log(`[Middleware] Accessing protected route: ${pathname}`);
    if (!accessToken) {
      console.warn(`[Middleware] No access token cookie found. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';
      console.log(`[Middleware] Verifying token against API: ${apiBase}/auth/me`);
      
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Cookie: `access_token=${accessToken}` },
      });

      console.log(`[Middleware] API /auth/me response status: ${res.status}`);

      if (!res.ok) {
        console.warn(`[Middleware] API returned non-OK status. Redirecting to /login`);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const user = (await res.json()) as { role?: string };
      console.log(`[Middleware] User fetched successfully. Role:`, user.role);

      if (user.role !== 'ADMIN') {
        console.warn(`[Middleware] User is not an ADMIN. Redirecting to /unauthorized`);
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      console.log(`[Middleware] Authorization successful for admin route.`);
      return NextResponse.next();
    } catch (error) {
      console.error(`[Middleware] Exception occurred during token verification:`, error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

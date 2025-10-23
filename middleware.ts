import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token");
    const isAuthenticated = !!authToken;
    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === "/login";
    const isRootPage = pathname === "/";

    // Redirect root to login if not authenticated
    if (isRootPage) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to login if not authenticated and not on login page
    if (!isAuthenticated && !isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to dashboard if authenticated and on login page
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If anything fails, allow the request through
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};

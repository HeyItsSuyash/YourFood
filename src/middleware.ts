import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "yourfood_super_secret_jwt_key_2026_auth_production_secure_token"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect staff and dashboard routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/kitchen") || pathname.startsWith("/service")) {
    const sessionCookie = request.cookies.get("yourfood_session")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      const role = payload.role as string;

      // Role isolation:
      // Kitchen staff directly navigating to restricted settings should be routed to kitchen
      if (role === "kitchen" && !pathname.startsWith("/kitchen")) {
        return NextResponse.redirect(new URL("/kitchen", request.url));
      }

      // Waiter staff directly navigating to restricted settings should be routed to service
      if (role === "waiter" && !pathname.startsWith("/service")) {
        return NextResponse.redirect(new URL("/service", request.url));
      }

      return NextResponse.next();
    } catch (err) {
      // Invalid token
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/kitchen/:path*",
    "/service/:path*",
  ],
};

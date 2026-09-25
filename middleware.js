import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// First line of defence: visitors can't open member pages, and only admins
// can open /admin. Every page and API route checks again on the server.
export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?denied=1", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => Boolean(token) },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/library/:path*", "/compare/:path*", "/settings/:path*", "/admin/:path*"],
};

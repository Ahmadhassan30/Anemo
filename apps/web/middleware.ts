import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;

      // Protect /student routes
      if (path.startsWith("/student")) {
        return !!token && token.role === "student";
      }

      // Protect /professor routes (assuming from previous task)
      if (path.startsWith("/professor")) {
        return !!token && token.role === "professor";
      }

      return true; // Allow other routes (like login, signup)
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/student/:path*",
    "/professor/:path*",
  ],
};

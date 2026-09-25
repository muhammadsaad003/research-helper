"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "rgb(var(--ink))",
            color: "rgb(var(--canvas))",
            fontSize: "14px",
            borderRadius: "6px",
          },
        }}
      />
    </SessionProvider>
  );
}

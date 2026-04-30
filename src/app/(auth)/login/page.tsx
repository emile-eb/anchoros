import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Sign in"
      title="A calmer operating system for the sales process."
      description="Anchor Studios OS keeps the first phase intentionally tight: clean auth, shared workspace access, and a fast base for the next product layers."
    >
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </AuthShell>
  );
}

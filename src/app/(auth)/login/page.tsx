import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Sign in"
      title="A calmer operating system for the sales process."
      description="Sign in with the email that has access to your workspace. Anchor Studios OS keeps auth, workspace access, and field execution tightly connected."
    >
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </AuthShell>
  );
}

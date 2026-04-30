import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Create account"
      title="Create the account that your invite will attach to."
      description="Workspace access is now invitation-based. Use the same email address that received the invite, then finish acceptance inside the product."
    >
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="sign-up" />
        </Suspense>
      </div>
    </AuthShell>
  );
}

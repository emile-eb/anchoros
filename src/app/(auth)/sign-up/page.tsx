import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Create account"
      title="Provision access to the seeded Anchor Studios workspace."
      description="Phase 1 is optimized for the two cofounders. Each approved signup lands inside the shared company workspace with the same navigation and data foundation."
    >
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="sign-up" />
        </Suspense>
      </div>
    </AuthShell>
  );
}

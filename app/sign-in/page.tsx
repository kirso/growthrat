import { Suspense } from "react";
import { SignInForm } from "@/app/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-16 bg-[var(--color-rc-surface)]">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}

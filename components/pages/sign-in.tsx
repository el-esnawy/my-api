import Link from "next/link";
import { Suspense } from "react";
import { AuthFormCard } from "@/components/molecules/auth-form-card";
import { SignInForm } from "@/components/sections/auth/sign-in-form";

function SignInPageContent() {
  return (
    <AuthFormCard
      title="Welcome back"
      description="Sign in to manage your endpoints."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthFormCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageContent />
    </Suspense>
  );
}

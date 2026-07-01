import Link from "next/link";
import { AuthFormCard } from "@/components/molecules/auth-form-card";
import { SignUpForm } from "@/components/sections/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthFormCard
      title="Create your account"
      description="Start building custom REST endpoints in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthFormCard>
  );
}

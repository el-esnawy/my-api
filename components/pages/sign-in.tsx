"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { AuthFormCard } from "@/components/molecules/auth-form-card";
import { SignInForm } from "@/components/sections/auth/sign-in-form";

function SignInPageContent() {
  const { t } = useTranslation();

  return (
    <AuthFormCard
      title={t("auth.signIn.title")}
      description={t("auth.signIn.description")}
      footer={
        <>
          {t("auth.signIn.footerPrompt")}{" "}
          <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t("common.signUp")}
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

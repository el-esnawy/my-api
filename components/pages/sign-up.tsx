"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AuthFormCard } from "@/components/molecules/auth-form-card";
import { SignUpForm } from "@/components/sections/auth/sign-up-form";

export default function SignUpPage() {
  const { t } = useTranslation();

  return (
    <AuthFormCard
      title={t("auth.signUp.title")}
      description={t("auth.signUp.description")}
      footer={
        <>
          {t("auth.signUp.footerPrompt")}{" "}
          <Link href="/sign-in" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t("common.signIn")}
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthFormCard>
  );
}

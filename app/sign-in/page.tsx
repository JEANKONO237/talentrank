import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Sign in — TalentRank" };

export default async function SignInPage() {
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (user) redirect("/dashboard/talent");
  }
  return (
    <AuthShell
      eyebrow="Welcome back"
      title={<>Sign in to <span className="text-gradient-cyan">TalentRank</span></>}
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="text-cyan-300 hover:text-cyan-200">
            Create your account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}

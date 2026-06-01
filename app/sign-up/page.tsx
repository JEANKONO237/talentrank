import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Create your account — TalentRank" };

export default async function SignUpPage() {
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (user) redirect("/dashboard/talent");
  }
  return (
    <AuthShell
      eyebrow="Join TalentRank"
      title={<>Get ranked. <span className="text-gradient-cyan">Get hired.</span></>}
      subtitle="Choose whether you're a creative looking for missions or a studio sourcing talents."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}

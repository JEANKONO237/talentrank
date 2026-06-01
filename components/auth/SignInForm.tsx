"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/server-actions/auth";
import { Field, Input } from "./fields";

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn({ email, password });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const role = res.data?.role;
      router.push(role === "studio" ? "/dashboard/recruiter" : "/dashboard/talent");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email">
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
      </Field>
      <Field
        label="Password"
        action={
          <Link href="#" className="text-[12px] text-mist-400 hover:text-mist-50">
            Forgot?
          </Link>
        }
      >
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
      </Field>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" size="md" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
        <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
      </Button>
    </form>
  );
}

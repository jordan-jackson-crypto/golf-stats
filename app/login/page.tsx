"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 pb-safe">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-xs uppercase tracking-widest text-fg-faint">Golf Stats</div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Enter your email — we'll send you a one-tap magic link.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-xl border border-sg-gain/40 bg-sg-gain/5 p-4 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2 text-sg-gain" />
            <div className="text-sm font-medium text-fg">Check your email</div>
            <div className="mt-1 text-xs text-fg-muted">
              We sent a magic link to <span className="text-fg">{email}</span>. Tap it on this device to sign in.
            </div>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setEmail(""); }}
              className="mt-3 text-[11px] uppercase tracking-wide text-fg-muted underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-fg-faint">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-bg-raised py-2.5 pl-9 pr-3 text-base text-fg placeholder:text-fg-faint focus:border-border-strong focus:outline-none"
                  autoFocus
                />
              </div>
              {status === "error" && (
                <div className="mt-1.5 text-xs text-sg-loss">{errorMsg}</div>
              )}
            </div>
            <button
              type="submit"
              disabled={!email.trim() || status === "sending"}
              className={cn(
                "w-full rounded-lg py-3 text-sm font-semibold uppercase tracking-wide",
                !email.trim() || status === "sending"
                  ? "bg-bg-muted text-fg-faint"
                  : "bg-primary text-white active:bg-primary-hover",
              )}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            <p className="text-center text-[11px] text-fg-faint">
              No password. No sign-up. Just tap the link in your email.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

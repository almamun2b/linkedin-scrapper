import { ShieldCheck, Timer, UserCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";

const PRINCIPLES = [
  {
    icon: Timer,
    text: "Collection is deliberately paced across minutes and hours, not run as a one-shot batch job.",
  },
  {
    icon: UserCheck,
    text: "At most one live session per LinkedIn account, enforced by a database lock.",
  },
  {
    icon: ShieldCheck,
    text: "A challenge or authwall trips a hard stop — cancelled jobs and a human review, never an auto-retry.",
  },
] as const;

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground"
    >
      in
    </span>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Brand panel: hidden on small screens so the form is what a phone visitor sees
          first, not something to scroll past. */}
      <section className="hidden flex-col justify-between gap-8 bg-accent-navy px-8 py-10 text-white lg:flex lg:w-1/2 lg:p-16">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold">LinkedIn Scrapper</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-balance lg:text-3xl">
            Structured filters in, a usable outbound lead list out.
          </h1>
          <p className="mt-3 text-sm text-white/70">
            A self-hosted extraction system built around account survivability, not raw throughput —
            the operator&rsquo;s own dashboard for accounts, searches, and results.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {PRINCIPLES.map((principle) => (
            <li key={principle.text} className="flex items-start gap-3 text-sm text-white/80">
              <principle.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              {principle.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <BrandMark />
          <span className="text-sm font-semibold text-foreground">LinkedIn Scrapper</span>
        </div>
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Sign in</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Use your dashboard credentials — not your LinkedIn account.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

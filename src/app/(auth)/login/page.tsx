import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[--color-bg] px-4">
      <div className="w-full max-w-sm rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-[--color-fg]">Sign in</h1>
        <p className="mb-6 text-sm text-[--color-muted]">LinkedIn Scrapper admin dashboard</p>
        <LoginForm />
      </div>
    </main>
  );
}

/**
 * Split out of `JobRowActions.tsx` so the `Date.now()` call lives in a plain function
 * rather than a component's render body — `eslint-plugin-react-hooks`'s purity rule flags
 * an impure builtin called directly inside a component/hook, since render must stay
 * idempotent for concurrent rendering.
 */
export function isScheduledForLater(runAt: Date): boolean {
  return runAt.getTime() > Date.now();
}

import { AccountStatus } from "../../../generated/prisma/enums";

/**
 * Nothing transitions out of RESTRICTED automatically — matches ARCHITECTURE.md §6.6's
 * scheduler rule ("never auto-reactivate a RESTRICTED account"). Only a human, editing the
 * row directly, moves a RESTRICTED account anywhere else.
 */
const ALLOWED: Record<AccountStatus, readonly AccountStatus[]> = {
  UNVERIFIED: [AccountStatus.ACTIVE, AccountStatus.CHALLENGED, AccountStatus.DISABLED],
  ACTIVE: [
    AccountStatus.CHALLENGED,
    AccountStatus.COOLING_DOWN,
    AccountStatus.RESTRICTED,
    AccountStatus.DISABLED,
  ],
  COOLING_DOWN: [
    AccountStatus.ACTIVE,
    AccountStatus.CHALLENGED,
    AccountStatus.RESTRICTED,
    AccountStatus.DISABLED,
  ],
  CHALLENGED: [AccountStatus.ACTIVE, AccountStatus.RESTRICTED, AccountStatus.DISABLED],
  RESTRICTED: [AccountStatus.DISABLED],
  DISABLED: [AccountStatus.ACTIVE],
};

export function canTransition(from: AccountStatus, to: AccountStatus): boolean {
  return ALLOWED[from].includes(to);
}

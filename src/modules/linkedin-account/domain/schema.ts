import { z } from "zod";

export const bootstrapInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  label: z.string().default("primary"),
});
export type BootstrapInput = z.infer<typeof bootstrapInputSchema>;

export const createAccountSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  label: z.string().trim().min(1).default("primary"),
  timezone: z.string().trim().min(1).default("UTC"),
  proxyId: z.string().min(1).nullable().optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountMetaSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  proxyId: z.string().min(1).nullable().optional(),
  password: z.string().min(1).optional(),
});
export type UpdateAccountMetaInput = z.infer<typeof updateAccountMetaSchema>;

export const deleteAccountSchema = z.object({
  id: z.string().min(1),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

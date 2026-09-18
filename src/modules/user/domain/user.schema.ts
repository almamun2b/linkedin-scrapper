import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).optional(),
  role: z.enum(Role),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const setDisabledSchema = z.object({
  userId: z.string().min(1),
  disabled: z.coerce.boolean(),
});
export type SetDisabledInput = z.infer<typeof setDisabledSchema>;

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  name: z.string().trim().min(1).optional(),
  role: z.enum(Role),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** `currentPassword` is required in self mode and ignored in admin-reset mode — the
 * service (not this schema) decides which mode applies, from who the actor is relative
 * to `userId`. */
export const changePasswordSchema = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

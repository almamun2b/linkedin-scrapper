import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).optional(),
  role: z.enum(Role),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(Role),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const setDisabledSchema = z.object({
  userId: z.string().min(1),
  disabled: z.coerce.boolean(),
});
export type SetDisabledInput = z.infer<typeof setDisabledSchema>;

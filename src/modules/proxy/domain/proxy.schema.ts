import { z } from "zod";
import { ProxyProtocol } from "@/generated/prisma/enums";

export const createProxySchema = z.object({
  label: z.string().trim().min(1),
  protocol: z.enum(ProxyProtocol),
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1).optional(),
  country: z.string().trim().min(1).optional(),
});
export type CreateProxyInput = z.infer<typeof createProxySchema>;

export const updateProxySchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).optional(),
  protocol: z.enum(ProxyProtocol).optional(),
  host: z.string().trim().min(1).optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1).optional(),
  country: z.string().trim().min(1).optional(),
});
export type UpdateProxyInput = z.infer<typeof updateProxySchema>;

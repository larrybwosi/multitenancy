import { z } from "zod";

/**
 * Types of audit actions that can be logged
 */
export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  VIEW = "VIEW",
  ADD_TO_CART = "ADD_TO_CART",
  REMOVE_FROM_CART = "REMOVE_FROM_CART",
  DELETE_FROM_CART = "DELETE_FROM_CART",
  APPLY_COUPON = "APPLY_COUPON",
  REMOVE_COUPON = "REMOVE_COUPON",
  PROCESS_PAYMENT = "PROCESS_PAYMENT",
  CANCEL_ORDER = "CANCEL_ORDER",
  CONFIRM_ORDER = "CONFIRM_ORDER",
  CREATE_CATEGORY = "CREATE_CATEGORY",
  UPDATE_CATEGORY = "UPDATE_CATEGORY",
  DELETE_CATEGORY = "DELETE_CATEGORY",
  CREATE_PRODUCT = "CREATE_PRODUCT",
  UPDATE_PRODUCT = "UPDATE_PRODUCT",
  DELETE_PRODUCT = "DELETE_PRODUCT",
  CREATE_ORDER = "CREATE_ORDER",
  UPDATE_ORDER = "UPDATE_ORDER",
  DELETE_ORDER = "DELETE_ORDER",
  CREATE_USER = "CREATE_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",
  CREATE_COUPON = "CREATE_COUPON",
  UPDATE_COUPON = "UPDATE_COUPON",
  DELETE_COUPON = "DELETE_COUPON",
  CREATE_BUSINESS = "CREATE_BUSINESS",
  UPDATE_BUSINESS = "UPDATE_BUSINESS",
  UPDATE_STOCK = "UPDATE_STOCK",
  CREATE_CUSTOMER="CREATE_CUSTOMER",
}

/**
 * Types of resources that can be audited
 */
export enum AuditResource {
  PRODUCT = "PRODUCT",
  ORDER = "ORDER",
  CUSTOMER = "CUSTOMER",
  COUPON = "COUPON",
  CART = "CART",
  BUSINESS = "BUSINESS",
  USER = "USER",
  CATEGORY = "CATEGORY",
  PAYMENT = "PAYMENT",
}

// Zod schema for audit log input validation
export const AuditLogSchema = z.object({
  user_id: z.string(),
  action: z.string().min(1, "Action is required"),
  entity_type: z.string().min(1, "Entity type is required"),
  entity_id: z.number().nullable().optional(),
  details: z.any().optional(),
  ip_Address: z.string().nullable().optional(),
});

// Type definitions
export type AuditLog = {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: any;
  ip_address: string | null;
  created_at: Date;
};

export type AuditLogInput = z.infer<typeof AuditLogSchema>;

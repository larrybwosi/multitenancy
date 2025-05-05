// This file contains TypeScript definitions for Prisma enums
// Used to avoid direct imports from Prisma client in UI components

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
  CASHIER = "CASHIER",
  REPORTER = "REPORTER"
}

export enum ApprovalActionType {
  ROLE = "ROLE",
  SPECIFIC_MEMBER = "SPECIFIC_MEMBER"
}

export enum ApprovalMode {
  ANY_ONE = "ANY_ONE",
  ALL = "ALL"
}

export enum ConditionType {
  AMOUNT_RANGE = "AMOUNT_RANGE",
  LOCATION = "LOCATION",
  EXPENSE_CATEGORY = "EXPENSE_CATEGORY"
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REQUEST_CHANGES = "REQUEST_CHANGES",
  REQUEST_INFO = "REQUEST_INFO"
} 
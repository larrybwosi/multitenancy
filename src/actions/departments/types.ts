// From your schema.txt
// enum DepartmentMemberRole { HEAD, MANAGER, MEMBER, VIEWER } [cite: 34]
// enum MemberRole { OWNER, ADMIN, MANAGER, EMPLOYEE, CASHIER, REPORTER }
// enum UserRole { SUPER_ADMIN, ADMIN, DEVELOPER, CLIENT, MEMBER } [cite: 3]

interface User {
  id: string;
  email: string; // [cite: 2]
  role: UserRole; // [cite: 3]
  name?: string | null;
  // ... other User fields from schema [cite: 1, 4, 5, 6, 7, 8]
}

interface Member {
  id: string;
  userId: string;
  user: User;
  organizationId: string;
  role: MemberRole; // Role within the organization [cite: 9]
  // ... other Member fields from schema [cite: 9, 10, 11, 12, 13, 14, 15, 16, 17]
}

interface Department {
  id: string;
  name: string; // [cite: 28]
  description?: string | null; // [cite: 29]
  organizationId: string; // [cite: 29]
  departmentMembers?: DepartmentMember[]; // [cite: 28]
  customFields?: any | null; // [cite: 32]
  createdAt: Date;
  updatedAt: Date;
  totalMembers:number
  head: Member
  // ... other Department fields [cite: 30, 31]
}

interface DepartmentMember {
  id: string;
  departmentId: string;
  department: Department;
  memberId: string;
  member: Member;
  role: DepartmentMemberRole; // Role within the department [cite: 33]
  canApproveExpenses: boolean; // [cite: 33]
  canManageBudget: boolean; // [cite: 33]
  createdAt: Date;
  updatedAt: Date;
}

// --- API Response Interfaces ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// --- Input DTOs ---

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  customFields?: any;
}

export interface AddMemberToDepartmentDto {
  departmentId: string;
  memberId: string; // [cite: 33]
  role: DepartmentMemberRole; // [cite: 33]
  canApproveExpenses?: boolean; // [cite: 33]
  canManageBudget?: boolean; // [cite: 33]
}


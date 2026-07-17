import { z } from "zod";

// Course metadata
export const COURSES = [
  "B.Sc Computer Science",
  "B.Sc Information Technology",
  "B.Com",
  "B.A English",
  "B.E Mechanical",
  "B.E Civil",
  "BBA",
  "BCA",
] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export const YEARS = [1, 2, 3, 4] as const;
export const ROLES = ["PRINCIPAL", "ADMIN"] as const;

const nameRegex = /^[A-Za-z][A-Za-z\s.'-]*$/;
const mobileRegex = /^[0-9]{10}$/;

// Student Zod Schema
export const studentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(nameRegex, "Name may only contain letters, spaces and . ' -"),
  course: z.enum(COURSES, { errorMap: () => ({ message: "Select a valid course" }) }),
  year: z.coerce
    .number({ invalid_type_error: "Year is required" })
    .int()
    .refine((v) => (YEARS as readonly number[]).includes(v), "Year must be between 1 and 4"),
  dob: z.coerce
    .date({ invalid_type_error: "Date of birth is required" })
    .refine((d) => d < new Date(), "Date of birth must be in the past"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  mobile: z.string().trim().regex(mobileRegex, "Mobile must be exactly 10 digits"),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: "Select a gender" }) }),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address must be at most 300 characters"),
});

// Update schema makes all fields optional
export const studentUpdateSchema = studentSchema.partial();

// Staff/User creation Zod Schema
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(ROLES, { errorMap: () => ({ message: "Role must be PRINCIPAL or ADMIN" }) }),
});

// Login Zod Schema
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Inferred TypeScript Types
export type Course = typeof COURSES[number];
export type Gender = typeof GENDERS[number];
export type Year = typeof YEARS[number];
export type Role = typeof ROLES[number];

export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Shared interface definitions
export interface Student {
  id: number;
  admissionNumber: string;
  name: string;
  course: string;
  year: number;
  dob: Date;
  email: string;
  mobile: string;
  gender: Gender;
  address: string;
  photoUrl: string | null;
  photoPublicId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  course?: string;
  year?: number;
  gender?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface StudentMeta {
  courses: readonly string[];
  genders: readonly string[];
  years: readonly number[];
  photoUploadEnabled: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}

// Zod formatting helper
export function formatZodError(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

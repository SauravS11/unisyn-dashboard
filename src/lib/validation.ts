import { z } from "zod";

// Team member validation schema
export const teamMemberSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Full name contains invalid characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .email("Invalid email address"),
  contact_number: z
    .string()
    .trim()
    .min(1, "Contact number is required")
    .max(20, "Contact number must be less than 20 characters")
    .regex(/^[\d\s\-+()]+$/, "Contact number contains invalid characters"),
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(100, "Role must be less than 100 characters"),
  permission_level: z
    .string()
    .min(1, "Permission level is required"),
});

// Specialist validation schema
export const specialistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Name contains invalid characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .email("Invalid email address"),
  role: z
    .string()
    .trim()
    .max(100, "Role must be less than 100 characters")
    .optional()
    .default("Specialist"),
  categoryId: z
    .string()
    .uuid("Invalid category ID"),
});

// Deal code validation schema - must be exactly 6 numeric digits
export const dealCodeSchema = z
  .string()
  .length(6, "Deal code must be exactly 6 digits")
  .regex(/^\d{6}$/, "Deal code must contain only digits (0-9)");

// Legacy alias for backwards compatibility
export const passcodeSchema = dealCodeSchema;

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// Email validation helper
export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

// Result types for validation
type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; errors: string[] };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data } as ValidationSuccess<T>;
  }
  
  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors } as ValidationFailure;
}

// Type exports
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type SpecialistInput = z.infer<typeof specialistSchema>;

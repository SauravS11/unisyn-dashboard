// Centralized error handling utility for sanitized error logging and user messages

// Error codes for client-facing responses
export const ERROR_CODES = {
  GENERIC: "ERR_GENERIC",
  NETWORK: "ERR_NETWORK",
  DATABASE: "ERR_DATABASE",
  VALIDATION: "ERR_VALIDATION",
  AUTH: "ERR_AUTH",
  NOT_FOUND: "ERR_NOT_FOUND",
  RATE_LIMIT: "ERR_RATE_LIMIT",
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

interface SanitizedError {
  code: ErrorCode;
  message: string;
}

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Sanitize error for safe logging (removes sensitive database details)
function sanitizeErrorForLog(error: unknown): string {
  if (error instanceof Error) {
    // Remove potentially sensitive patterns from error messages
    const sensitivePatterns = [
      /password/gi,
      /secret/gi,
      /key/gi,
      /token/gi,
      /auth\./gi,
      /public\./gi,
      /postgres/gi,
      /supabase/gi,
      /column/gi,
      /table/gi,
      /relation/gi,
      /constraint/gi,
      /violates/gi,
    ];

    let sanitizedMessage = error.message;
    sensitivePatterns.forEach((pattern) => {
      sanitizedMessage = sanitizedMessage.replace(pattern, "[REDACTED]");
    });

    return sanitizedMessage;
  }

  return "Unknown error occurred";
}

// Map error to user-friendly message
function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return ERROR_CODES.NETWORK;
    }
    if (message.includes("unauthorized") || message.includes("auth")) {
      return ERROR_CODES.AUTH;
    }
    if (message.includes("not found") || message.includes("no rows")) {
      return ERROR_CODES.NOT_FOUND;
    }
    if (message.includes("rate") || message.includes("too many")) {
      return ERROR_CODES.RATE_LIMIT;
    }
    if (
      message.includes("postgres") ||
      message.includes("database") ||
      message.includes("constraint")
    ) {
      return ERROR_CODES.DATABASE;
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return ERROR_CODES.VALIDATION;
    }
  }

  return ERROR_CODES.GENERIC;
}

// User-friendly messages for each error code
const userMessages: Record<ErrorCode, string> = {
  [ERROR_CODES.GENERIC]: "An error occurred. Please try again.",
  [ERROR_CODES.NETWORK]: "Network error. Please check your connection and try again.",
  [ERROR_CODES.DATABASE]: "Failed to save data. Please try again.",
  [ERROR_CODES.VALIDATION]: "Invalid data provided. Please check your input.",
  [ERROR_CODES.AUTH]: "Authentication error. Please sign in again.",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found.",
  [ERROR_CODES.RATE_LIMIT]: "Too many requests. Please wait and try again.",
};

/**
 * Handle errors with sanitized logging and user-friendly messages
 * 
 * @param context - Context string for logging (e.g., "saving team member")
 * @param error - The error object
 * @returns Sanitized error for user display
 */
export function handleError(context: string, error: unknown): SanitizedError {
  const code = getErrorCode(error);
  const sanitizedMessage = sanitizeErrorForLog(error);

  // In development, log full error for debugging
  if (isDev) {
    console.error(`[DEV] Error ${context}:`, error);
  } else {
    // In production, log only sanitized version
    console.warn(`Error ${context}: ${code}`);
  }

  return {
    code,
    message: userMessages[code],
  };
}

/**
 * Get user-friendly error message from error code
 */
export function getUserMessage(code: ErrorCode): string {
  return userMessages[code] || userMessages[ERROR_CODES.GENERIC];
}

/**
 * Log info message (safe for production)
 */
export function logInfo(context: string, message: string): void {
  if (isDev) {
    console.log(`[INFO] ${context}: ${message}`);
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.log(`[DEBUG] ${context}: ${message}`, data || "");
  }
}

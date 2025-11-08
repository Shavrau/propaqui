/**
 * Error sanitization utility to prevent information leakage
 * Maps database error codes to user-friendly messages
 */

export function getSafeErrorMessage(error: any): string {
  // If error has a PostgreSQL error code, map it to a safe message
  if (error?.code) {
    const safeMessages: Record<string, string> = {
      '23505': 'Este registro já existe no sistema',
      '23503': 'Não é possível realizar esta operação devido a dependências',
      '42501': 'Você não tem permissão para executar esta operação',
      '23502': 'Todos os campos obrigatórios devem ser preenchidos',
      '23514': 'Os dados fornecidos não são válidos',
      '42P01': 'Recurso não encontrado',
      'PGRST116': 'Você não tem permissão para acessar este recurso',
    };
    
    if (safeMessages[error.code]) {
      return safeMessages[error.code];
    }
  }

  // Check for common error message patterns and sanitize them
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // RLS policy errors
    if (message.includes('row-level security') || message.includes('rls')) {
      return 'Você não tem permissão para executar esta operação';
    }
    
    // Authentication errors
    if (message.includes('jwt') || message.includes('not authenticated')) {
      return 'Sua sessão expirou. Por favor, faça login novamente';
    }
    
    // Duplicate key errors
    if (message.includes('duplicate') || message.includes('unique constraint')) {
      return 'Este registro já existe no sistema';
    }
    
    // Foreign key errors
    if (message.includes('foreign key')) {
      return 'Não é possível realizar esta operação devido a dependências';
    }
    
    // Custom validation errors (pass through)
    if (message.includes('cpf') || message.includes('inválido')) {
      return error.message;
    }
  }

  // Default generic error message
  return 'Ocorreu um erro inesperado. Por favor, tente novamente';
}

/**
 * Log error details to console in development
 * In production, this should be sent to a monitoring service
 */
export function logError(error: any, context?: string) {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
  // TODO: In production, send to error tracking service (e.g., Sentry)
}

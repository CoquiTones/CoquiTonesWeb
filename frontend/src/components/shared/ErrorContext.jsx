import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const ErrorContext = createContext(null);

let fallbackId = 0;
const nextId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  fallbackId += 1;
  return `error-${Date.now()}-${fallbackId}`;
};

/**
 * Normalizes anything thrown/reported by the app into a displayable error.
 * The original `Error` instance is preserved so callers can still inspect it.
 */
export const toAppError = (input) => {
  if (input && typeof input === 'object' && 'message' in input) {
    return {
      id: input.id ?? nextId(),
      message: String(input.message || 'Unexpected error'),
      name: input.name ?? 'Error',
      cause: input,
    };
  }

  if (typeof input === 'string') {
    return { id: nextId(), message: input, name: 'Error', cause: input };
  }

  return {
    id: nextId(),
    message: 'Unexpected error',
    name: 'Error',
    cause: input,
  };
};

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const addError = useCallback((error) => {
    const normalized = toAppError(error);
    // Avoid stacking the same message repeatedly (e.g. duplicated 401s).
    setErrors((prev) =>
      prev.some((entry) => entry.message === normalized.message)
        ? prev
        : [...prev, normalized],
    );
    return normalized.id;
  }, []);

  const removeError = useCallback((id) => {
    setErrors((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  const value = useMemo(
    () => ({ errors, setErrors, addError, removeError, clearErrors }),
    [errors, addError, removeError, clearErrors],
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useErrors = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrors must be used within an ErrorProvider');
  }
  return context;
};

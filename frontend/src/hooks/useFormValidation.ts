import { useState, useCallback, useEffect } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
}

interface FieldConfig {
  rules: ValidationRule;
  message?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  fieldConfigs: Record<keyof T, FieldConfig>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((fieldName: keyof T, value: any): string | null => {
    const config = fieldConfigs[fieldName];
    if (!config) return null;

    const { rules } = config;

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return config.message || `${String(fieldName)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return config.message || 'Please enter a valid email address';
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(value);
      } catch {
        return config.message || 'Please enter a valid URL';
      }
    }

    // Number validation
    if (rules.number) {
      if (isNaN(Number(value))) {
        return config.message || 'Please enter a valid number';
      }
    }

    // Min/Max for numbers
    if (rules.min !== undefined && Number(value) < rules.min) {
      return config.message || `Value must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      return config.message || `Value must be at most ${rules.max}`;
    }

    // Length validations
    if (rules.minLength && value.toString().length < rules.minLength) {
      return config.message || `Minimum length is ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return config.message || `Maximum length is ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return config.message || 'Invalid format';
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [fieldConfigs]);

  const validateAll = useCallback((): ValidationResult => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    Object.keys(fieldConfigs).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      if (error) {
        newErrors[fieldName] = error;
        valid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(valid);

    return { isValid: valid, errors: newErrors };
  }, [values, fieldConfigs, validateField]);

  const setValue = useCallback((fieldName: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    // Validate field on change if it's been touched
    if (touched[fieldName as string]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }));
    }
  }, [touched, validateField]);

  const setFieldTouched = useCallback((fieldName: keyof T) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Validate field when touched
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));
  }, [values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialValues]);

  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Validate all fields when values change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateAll();
    }, 300); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [values, validateAll]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setFieldTouched,
    validateAll,
    resetForm,
    setFormValues,
    getFieldProps: (fieldName: keyof T) => ({
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(fieldName, e.target.value),
      onBlur: () => setFieldTouched(fieldName),
      error: touched[fieldName as string] && !!errors[fieldName as string],
      helperText: touched[fieldName as string] ? errors[fieldName as string] : ''
    })
  };
};

// Common validation rules
export const validationRules = {
  required: { required: true },
  email: { required: true, email: true },
  password: { required: true, minLength: 6 },
  name: { required: true, minLength: 2, maxLength: 50 },
  phone: {
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number'
  },
  url: { url: true },
  positiveNumber: { required: true, number: true, min: 0 },
  percentage: { required: true, number: true, min: 0, max: 100 }
};
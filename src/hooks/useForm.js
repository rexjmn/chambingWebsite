import { useState } from 'react';
import { logger } from '../utils/logger';

export const useForm = (initialValues = {}, validationSchema = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));

    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    
    if (validationSchema) {
      validateField(name, values[name]);
    }
  };

  const validateField = (name, value) => {
    if (!validationSchema) return true;

    try {
      validationSchema.validateSyncAt(name, { [name]: value });
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
      return true;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error.message,
      }));
      return false;
    }
  };

  const validateForm = () => {
    if (!validationSchema) return true;

    try {
      validationSchema.validateSync(values, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      const formErrors = {};
      error.inner.forEach(err => {
        formErrors[err.path] = err.message;
      });
      setErrors(formErrors);
      return false;
    }
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const touchedFields = {};
    Object.keys(values).forEach(key => {
      touchedFields[key] = true;
    });
    setTouched(touchedFields);

    // Validate form
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      logger.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  };
};

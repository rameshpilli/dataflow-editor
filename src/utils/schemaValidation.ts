
import { DataRow, DatasetColumn, ValidationError, ValidationResult } from '@/types/adls';

export function validateData(rows: DataRow[], columns: DatasetColumn[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  // For each row
  rows.forEach(row => {
    // Check each column with validation rules
    columns.forEach(column => {
      if (!column.validation) return;
      
      const value = row[column.name];
      const validation = column.validation;
      
      // Required field validation
      if (validation.required && (value === null || value === undefined || value === '')) {
        errors.push({
          rowId: row.__id,
          columnName: column.name,
          message: `Required field cannot be empty`,
          severity: 'error'
        });
      }
      
      // Skip other validations if value is null/undefined and not required
      if (value === null || value === undefined || value === '') return;
      
      // String validations
      if (column.type === 'string' && typeof value === 'string') {
        // Min length
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors.push({
            rowId: row.__id,
            columnName: column.name,
            message: `Text length (${value.length}) is less than minimum length (${validation.minLength})`,
            severity: 'error'
          });
        }
        
        // Max length
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors.push({
            rowId: row.__id,
            columnName: column.name,
            message: `Text length (${value.length}) exceeds maximum length (${validation.maxLength})`,
            severity: 'error'
          });
        }
        
        // Pattern matching
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          errors.push({
            rowId: row.__id,
            columnName: column.name,
            message: `Value does not match required format pattern`,
            severity: 'error'
          });
        }
      }
      
      // Numeric validations
      if ((column.type === 'integer' || column.type === 'decimal') && 
          (typeof value === 'number' || !isNaN(Number(value)))) {
        const numValue = typeof value === 'number' ? value : Number(value);
        
        // Min value
        if (validation.minValue !== undefined && numValue < validation.minValue) {
          errors.push({
            rowId: row.__id,
            columnName: column.name,
            message: `Value (${numValue}) is less than minimum (${validation.minValue})`,
            severity: 'error'
          });
        }
        
        // Max value
        if (validation.maxValue !== undefined && numValue > validation.maxValue) {
          errors.push({
            rowId: row.__id,
            columnName: column.name,
            message: `Value (${numValue}) exceeds maximum (${validation.maxValue})`,
            severity: 'error'
          });
        }
      }
      
      // Enum validation (allowed values)
      if (validation.enum && validation.enum.length > 0) {
        const stringValue = String(value);
        if (!validation.enum.includes(stringValue) && !validation.enum.includes(value)) {
          errors.push({
            rowId: row.__id,
            columnName: column.name,
            message: `Value is not in the list of allowed values (${validation.enum.join(', ')})`,
            severity: 'error'
          });
        }
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateValue(value: any, column: DatasetColumn): {isValid: boolean, message?: string} {
  if (!column.validation) return { isValid: true };
  
  const validation = column.validation;
  
  // Required field validation
  if (validation.required && (value === null || value === undefined || value === '')) {
    return {
      isValid: false,
      message: `Required field cannot be empty`
    };
  }
  
  // Skip other validations if value is null/undefined and not required
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }
  
  // String validations
  if (column.type === 'string' && typeof value === 'string') {
    // Min length
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      return {
        isValid: false,
        message: `Text too short (min: ${validation.minLength})`
      };
    }
    
    // Max length
    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      return {
        isValid: false,
        message: `Text too long (max: ${validation.maxLength})`
      };
    }
    
    // Pattern matching
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return {
        isValid: false,
        message: `Does not match required format`
      };
    }
  }
  
  // Numeric validations
  if ((column.type === 'integer' || column.type === 'decimal') && 
      (typeof value === 'number' || !isNaN(Number(value)))) {
    const numValue = typeof value === 'number' ? value : Number(value);
    
    // Min value
    if (validation.minValue !== undefined && numValue < validation.minValue) {
      return {
        isValid: false,
        message: `Below minimum (${validation.minValue})`
      };
    }
    
    // Max value
    if (validation.maxValue !== undefined && numValue > validation.maxValue) {
      return {
        isValid: false,
        message: `Exceeds maximum (${validation.maxValue})`
      };
    }
  }
  
  // Enum validation (allowed values)
  if (validation.enum && validation.enum.length > 0) {
    const stringValue = String(value);
    if (!validation.enum.includes(stringValue) && !validation.enum.includes(value)) {
      return {
        isValid: false,
        message: `Not in allowed values`
      };
    }
  }
  
  return { isValid: true };
}

import { SecurityPolicy, PolicyCondition, PolicyAction } from './types';

export class PolicyValidator {
  static validatePolicy(policy: SecurityPolicy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!policy.name || typeof policy.name !== 'string') {
      errors.push('Policy name is required and must be a string');
    }
    
    if (!policy.description || typeof policy.description !== 'string') {
      errors.push('Policy description is required and must be a string');
    }
    
    if (typeof policy.enabled !== 'boolean') {
      errors.push('Policy enabled flag must be a boolean');
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(policy.severity)) {
      errors.push('Policy severity must be one of: low, medium, high, critical');
    }
    
    if (typeof policy.priority !== 'number' || policy.priority < 1) {
      errors.push('Policy priority must be a positive number');
    }
    
    // Validate conditions
    if (!Array.isArray(policy.conditions) || policy.conditions.length === 0) {
      errors.push('Policy must have at least one condition');
    } else {
      policy.conditions.forEach((condition, index) => {
        const conditionErrors = this.validateCondition(condition);
        conditionErrors.forEach(error => {
          errors.push(`Condition ${index + 1}: ${error}`);
        });
      });
    }
    
    // Validate actions
    if (!Array.isArray(policy.actions) || policy.actions.length === 0) {
      errors.push('Policy must have at least one action');
    } else {
      policy.actions.forEach((action, index) => {
        const actionErrors = this.validateAction(action);
        actionErrors.forEach(error => {
          errors.push(`Action ${index + 1}: ${error}`);
        });
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private static validateCondition(condition: PolicyCondition): string[] {
    const errors: string[] = [];
    
    if (!['pattern_match', 'risk_score', 'agent_history', 'request_frequency'].includes(condition.type)) {
      errors.push('Invalid condition type');
    }
    
    if (!['equals', 'contains', 'greater_than', 'less_than', 'in_range'].includes(condition.operator)) {
      errors.push('Invalid condition operator');
    }
    
    if (condition.value === undefined || condition.value === null) {
      errors.push('Condition value is required');
    }
    
    // Type-specific validations
    if (condition.type === 'risk_score' && typeof condition.value !== 'number') {
      errors.push('Risk score condition value must be a number');
    }
    
    if (condition.type === 'request_frequency' && typeof condition.value !== 'number') {
      errors.push('Request frequency condition value must be a number');
    }
    
    return errors;
  }
  
  private static validateAction(action: PolicyAction): string[] {
    const errors: string[] = [];
    
    if (!['allow', 'block', 'warn', 'modify'].includes(action.type)) {
      errors.push('Invalid action type');
    }
    
    if (action.message && typeof action.message !== 'string') {
      errors.push('Action message must be a string');
    }
    
    if (action.metadata && typeof action.metadata !== 'object') {
      errors.push('Action metadata must be an object');
    }
    
    return errors;
  }
  
  static validatePolicies(policies: SecurityPolicy[]): { valid: boolean; errors: string[] } {
    const allErrors: string[] = [];
    let allValid = true;
    
    policies.forEach((policy, index) => {
      const result = this.validatePolicy(policy);
      if (!result.valid) {
        allValid = false;
        result.errors.forEach(error => {
          allErrors.push(`Policy ${index + 1} (${policy.name}): ${error}`);
        });
      }
    });
    
    return {
      valid: allValid,
      errors: allErrors
    };
  }
}


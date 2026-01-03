// Email Service exports
export { EmailService, createEmailService } from './EmailService';
export type {
  EmailTemplateType,
  EmailTemplateStyle,
  SMTPConfig,
  CompanyInfo,
  EmailOptions,
  SendEmailResult,
  TemplateVariables,
} from './EmailService';

// Token utilities
export {
  generateToken,
  generateNumericCode,
  getTokenExpiry,
  getTokenExpiryMinutes,
  isTokenExpired,
  hashToken,
  buildActivationUrl,
  buildPasswordResetUrl,
  getBaseUrl,
} from './tokenUtils';

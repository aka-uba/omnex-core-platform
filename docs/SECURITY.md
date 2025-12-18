# Security Policy - Omnex SaaS Platform

## Authentication & Authorization

### JWT Token System

**Access Tokens**
- Expiration: 7 days
- Algorithm: HS256
- Issuer: omnex-core
- Audience: omnex-api

**Refresh Tokens**
- Expiration: 30 days
- Used to obtain new access tokens
- Stored securely, HTTP-only cookies

### Password Policy

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

**Default Passwords (Development Only):**
- Super Admin: `uba1453.2010*`
- Tenant Admin: `omnex.fre.2520*`
- Default User: `user.2024*`

> ⚠️ **CRITICAL**: Change all default passwords in production!

### Role-Based Access Control (RBAC)

**Roles:**
1. **SuperAdmin** - Full system access
2. **AgencyUser** - Agency-level access
3. **ClientUser** - Basic user access (lowest privilege)

**Permission Model:**
- Modular permissions per feature
- Tenant-level isolation
- Row-level security

## Data Protection

### Encryption

**At Rest:**
- Database: PostgreSQL native encryption
- Files: AES-256 encryption for sensitive data

**In Transit:**
- HTTPS/TLS 1.3 required
- Secure WebSocket connections

### Multi-Tenant Isolation

**Database Level:**
- Separate database per tenant
- No cross-tenant queries
- Tenant context validation on every request

**Middleware Protection:**
- Tenant slug verification
- Request origin validation
- Cross-tenant access prevention

## API Security

### Rate Limiting

**Global Limits:**
- 100 requests per 15 minutes per IP
- Configurable via environment variables

**Auth Endpoints:**
- 10 requests per 15 minutes
- Prevents brute force attacks

### Input Validation

- Zod schema validation
- SQL injection prevention (Prisma ORM)
- XSS protection (Next.js built-in)
- CSRF protection

## Audit & Compliance

### Audit Logging

**Logged Events:**
- User authentication (login/logout)
- Permission changes
- Data modifications
- Failed access attempts

**Log Retention:**
- 90 days minimum
- Configurable per compliance requirements

### GDPR/KVKK Compliance

**Data Rights:**
- Right to access
- Right to deletion
- Right to portability
- Right to rectification

**Implementation:**
- User data export functionality
- Account deletion with data purge
- Consent management
- Data processing records

## Security Best Practices

### Development

```bash
# Never commit secrets
echo ".env" >> .gitignore

# Use environment variables
JWT_SECRET=$(openssl rand -hex 32)

# Regular dependency updates
npm audit fix
```

### Production

- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Regular security audits
- [ ] Automated backups
- [ ] Monitoring and alerting
- [ ] Incident response plan

### Secrets Management

**Environment Variables:**
- Never hardcode secrets
- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Different secrets per environment

## Vulnerability Reporting

**Contact:** security@omnexcore.com

**Process:**
1. Report vulnerability privately
2. Allow 90 days for fix
3. Coordinated disclosure

## Security Updates

**Monitoring:**
- npm audit
- Dependabot alerts
- CVE databases

**Update Schedule:**
- Critical: Immediate
- High: Within 7 days
- Medium: Within 30 days
- Low: Next release cycle

## Incident Response

**Steps:**
1. Identify and contain
2. Assess impact
3. Notify affected parties
4. Remediate
5. Post-incident review

**Contacts:**
- Security Team: security@omnexcore.com
- On-Call: +90-XXX-XXX-XXXX

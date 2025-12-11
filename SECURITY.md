# Security Considerations for ProjetoSmartPlan

## Current Security Status

### Implemented Security Measures ✅
- Password hashing with bcrypt (10 rounds)
- Session-based authentication with HTTP-only cookies
- Email domain restriction (@ufu.br only)
- Password complexity requirements
- Input validation and sanitization (Zod schemas)
- SQL injection prevention (Drizzle ORM)
- Authorization checks (users only access their own data)
- UTC timestamps to prevent timezone attacks

### Known Security Gaps ⚠️

#### 1. Missing Rate Limiting
**Impact**: All authenticated endpoints (including reminders) are vulnerable to brute force and DoS attacks.

**Recommendation**: Implement rate limiting using express-rate-limit:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

#### 2. Missing CSRF Protection
**Impact**: All POST/PUT/DELETE endpoints are vulnerable to Cross-Site Request Forgery attacks.

**Recommendation**: Implement CSRF tokens using csurf:

```javascript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// In routes
app.post('/api/reminders', csrfProtection, (req, res) => {
  // handler
});

// Send CSRF token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Reminders Module Security

The reminders module follows all existing security patterns:
- ✅ Authentication required on all endpoints
- ✅ Ownership validation (owner_email check)
- ✅ Input validation on all fields
- ✅ Type-safe implementation
- ✅ No SQL injection vulnerabilities
- ✅ Proper error handling without data leakage

## Production Deployment Checklist

Before deploying to production, address:

1. **Add rate limiting** to all API endpoints
2. **Implement CSRF protection** for state-changing operations
3. **Enable HTTPS** for all connections
4. **Set secure session configuration**:
   - `secure: true` (HTTPS only)
   - `httpOnly: true` (prevent XSS)
   - `sameSite: 'strict'` (CSRF protection)
5. **Add security headers** (helmet middleware)
6. **Implement request size limits**
7. **Add API logging and monitoring**
8. **Regular dependency updates** (npm audit)

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of opening a public issue.

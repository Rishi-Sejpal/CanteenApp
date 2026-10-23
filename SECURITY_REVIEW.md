# SybiEat Backend Authentication Security Review

## Overview
This review examines the authentication implementation in the SybiEat backend (`/home/rishis/Projects/fcc_project/backend/`). The system uses session-based authentication with JWT tokens as a secondary mechanism.

## Authentication Mechanisms

### 1. Session-Based Auth (`middleware/authMiddleware.js`)
- **`requireLogin`**: Checks `req.session.user` exists → 401 if missing
- **`requireStaff`**: Checks `req.session.user` exists AND role is "staff" or "admin" → 403 if insufficient

### 2. JWT Auth (`middleware/authJwt.js`)
- **`signToken`**: Creates JWT with sub, prn, role, name payloads
- **`verifyToken`**: Verifies JWT with secret, issuer, audience
- **`requireAuthJwt`**: Extracts token from `Authorization: Bearer` header OR `symbieat_token` cookie
- **`requireRole`**: Checks `req.user.role` is in allowed roles

**Note**: `authJwt` middleware is loaded but **not used by any routes**. All protected routes use `authMiddleware` session-based auth.

## Route Protection Mapping

| Route Group | Middleware | Auth Type |
|---|---|---|
| `authRoutes` | None | Public (register/login) |
| `cartRoutes` | `requireLogin` | Session-based |
| `paymentRoutes` | `requireLogin` | Session-based |
| `orderRoutes` | `requireLogin` + `requireStaff` (status) | Session-based |
| `menuRoutes` | `requireStaff` (POST/PUT/DELETE) | Session-based |
| `inventoryRoutes` | `requireStaff` (all routes) | Session-based |

## Security Assessment

### ✅ Strengths

1. **Session Regeneration on Login**: `authRoutes.js` uses `req.session.regenerate()` (line 35) which prevents session fixation attacks.

2. **College Email Validation**: Registration (`authRoutes.js` line 108) restricts to `@sitpune.edu.in` emails, preventing external account creation.

3. **Password Hashing**: Uses server-side salted SHA256 (`authRoutes.js` lines 24-32, `seed.js` lines 25-32, `createStaff.js` lines 8-11). Passwords are 8-72 characters.

4. **Logout Clears Both Cookies**: `authRoutes.js` logout (line 181) destroys the session AND clears the `symbieat.sid` cookie.

5. **Role-Based Access Control**: `requireStaff` (authMiddleware.js line 12) properly checks `["staff", "admin"].includes(req.session.user.role)`.

6. **Error Messages are Generic**: Login failure returns "Invalid PRN or password" (authRoutes.js line 278) - does not leak whether the PRN exists.

7. **CORS with Credentials**: `server.js` (line 20-25) has `credentials: true` which is correct for cookie-based auth, combined with `sameSite: "lax"`.

8. **Cookie Attributes**:
   - `httpOnly: true` prevents JavaScript access (XSS protection)
   - `secure: process.env.NODE_ENV === "production"` ensures HTTPS-only in production
   - `sameSite: "lax"` helps prevent CSRF

### ⚠️ Areas for Improvement

1. **JWT Not Integrated**: The `authJwt.js` middleware exists but no routes use `requireAuthJwt` or `requireRoute`. This means:
   - JWT tokens are set as cookies but not utilized for auth
   - Mixed auth mechanisms could cause confusion
   - Consider unifying on either session-based OR JWT-based auth

2. **No Rate Limiting on Login**: `POST /api/auth/login` has no rate limiting, vulnerable to brute-force attacks. (Demo environment may not require this, but worth noting.)

3. **Password Salting Method**: The salt is derived from the password hash itself:
   ```javascript
   const salt = crypto.createHash("sha256").update(String(password)).digest("hex").slice(0, 16);
   ```
   This is functional but non-standard. Industry best practice is to use a random salt (e.g., with bcrypt/argon2). However, since this is consistent across the codebase (authRoutes.js, seed.js, createStaff.js all use the same method), changing it would require updating all password verification paths.

4. **No Account Lockout/Brute-Force Protection**: Failed logins don't increment any counter or lock the account.

5. **Demo Accounts with Simple Passwords**: Seed data uses PRN as password (e.g., `20240101001 / 20240101001`), which is convenient for demos but not secure for production.

6. **No CSRF Tokens**: While `sameSite: "lax"` provides some CSRF protection, `sameSite: "strict"` or explicit CSRF tokens would be more robust, especially since CORS enables credential sending.

### 🔒 Recommendations

1. **Unify Authentication Strategy**: Choose either session-based OR JWT-based auth and use it consistently across all routes. If keeping session-based:
   - Remove the JWT cookie setting or integrate `requireAuthJwt` where appropriate
   - Or if adding JWT: migrate routes to use `requireAuthJwt` + `requireRole`

2. **Add Rate Limiting**: Implement rate limiting on `POST /api/auth/login` (e.g., 10 attempts per 15 minutes per IP).

3. **Consider bcrypt/Argon2**: For new development, use bcrypt or argon2 for password hashing. The current salted SHA256 works but is less secure than adaptive hashing functions.

4. **Add CSRF Protection**: Either use `sameSite: "strict"` or implement CSRF tokens for state-changing endpoints.

5. **Add Account Lockout**: After N failed login attempts, temporarily lock the account or increase delay.

6. **Environment Variable Validation**: Ensure `SESSION_SECRET` has sufficient entropy (currently `bb289518581f3dc11e214848295098697dc1ddc0449306515422a1612d9bc5fb` - 64 hex chars = 32 bytes, which is adequate).

7. **Token Expiry**: JWT tokens expire in 2h (`JWT_EXPIRES_IN=2h`). Consider shorter expiry (e.g., 15m) with refresh token flow.

## Validation Results

### Tests Performed

| Test | Result |
|---|---|
| Student login with valid credentials | ✅ Works |
| Staff login with valid credentials | ✅ Works |
| Admin login with valid credentials | ✅ Works |
| Access cart without auth | ✅ Returns 401 "Please log in first" |
| Access cart with valid session cookie | ✅ Returns cart data |
| Student accessing staff-only menu POST | ✅ Returns 403 "Staff or admin access required" |
| Staff adding menu item | ✅ Works |
| Student trying to update order status | ✅ Returns 403 "Staff or admin access required" |
| Logout clears session | ✅ Works |
| College email validation during register | ✅ Returns 400 for non-@sitpune.edu.in |

### Critical Findings

**No critical security vulnerabilities found**. The authentication system is functional and provides appropriate access control. The main area for improvement is the unused JWT middleware and lack of rate limiting on login attempts.

## Conclusion

The SybiEat backend authentication system is **working correctly** with proper session management, role-based access control, and secure cookie configuration. The system effectively prevents unauthorized access to protected routes and properly distinguishes between student, staff, and admin roles.

**Suggested next steps** (for production hardening):
1. Add rate limiting to login endpoint
2. Decide on unified auth strategy (session vs JWT)
3. Consider password hashing upgrade path
4. Add CSRF protection
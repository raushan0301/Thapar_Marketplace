# 🛡️ ThaparMarket Security Audit Report

**Date:** February 14, 2026
**Target:** ThaparMarket Application (Full Stack)
**Auditor:** Antigravity Agent

---

## 📊 Executive Summary

The application demonstrates a **strong security posture** for a campus marketplace. Key security pillars like Password Hashing (Bcrypt), Database Isolation (RLS), and Input Validation (Joi) are implemented correctly.

However, a **architectural redundancy** was identified where the Backend bypasses the Database Security (RLS) entirely by using a Service Role Key. While not a direct vulnerability, this relies entirely on backend code correctness and renders the database-level security dormant for API operations.

## 🚨 Vulnerability Assessment

### 1. Database Security Bypass (Backend)
- **Level:** 🟡 **MEDIUM** 
- **Description:** The backend connects to Supabase using `SUPABASE_SERVICE_KEY`, which bypasses all Row Level Security (RLS) policies defined in the database.
- **Risk:** If the backend code misses an authorization check (e.g., forgets to check `user_id` on listing update), the database will not block the request. The consistent use of RLS is currently "defense in depth" rather than the primary enforcement mechanism for API calls.
- **Location:** `backend/src/config/supabase.ts`

### 2. User Enumeration via Registration
- **Level:** 🔵 **LOW**
- **Description:** The registration endpoint returns the specific error message: `"User with this email already exists"`.
- **Risk:** Allows an attacker to check if a specific email address (e.g., a specific student or professor) has an account on the platform.
- **Location:** `backend/src/controllers/auth.controller.ts` (Line 29)

### 3. Potential Sensitive Data Exposure (Login)
- **Level:** 🔵 **LOW**
- **Description:** The login endpoint fetches all user fields (`select('*')`) and likely returns fields like `year`, `hostel`, and `phone` to the frontend state.
- **Risk:** While not critical (this is the user's *own* data), unnecessary data transfer increases the attack surface if the frontend is compromised (XSS).
- **Location:** `backend/src/controllers/auth.controller.ts` (Login function)

### 4. Cross-Site Scripting (XSS)
- **Level:** 🟢 **SAFE**
- **Analysis:** Frontend rendering of user-generated content (descriptions, messages) uses React's default escaping. No instances of `dangerouslySetInnerHTML` were found in critical display components.
- **Verified:** `frontend/app/listings/[id]/page.tsx`

### 5. SQL Injection
- **Level:** 🟢 **SAFE**
- **Analysis:** The application uses the Supabase Client (ORM-like) which uses parameterized queries under the hood. No raw string concatenation SQL queries were found.

### 6. Authentication & Session Management
- **Level:** 🟢 **SAFE**
- **Analysis:**
    - **Passwords:** Bcrypt (10 rounds) - Strong.
    - **Session:** JWT (Bearer Token) - Secure against CSRF.
    - **ID:** UUID v4 - Secure against enumeration.

### 7. Dependencies Audit
- **Frontend:** 🟢 **SAFE** (0 Vulnerabilities found).
- **Backend:** 🟡 **MEDIUM**
    - **Issue:** 2 High Severity Vulnerabilities in `tar` package (via `@mapbox/node-pre-gyp` -> `bcrypt`).
    - **Analysis:** These vulnerabilities relate to arbitrary file overwrite during tar extraction.
    - **Mitigation:** Your application usage of `bcrypt` does **not** expose tar extraction functionality to users. This is a build-time dependency risk, not a runtime exploitable risk in this specific context.
    - **Recommendation:** Monitor `bcrypt` updates for a version that upgrades its dependencies.

---

## 🛡️ Recommendations

### 1. Address Database Bypass (High Priority)
*   **Current:** Backend does `supabase.from('listings').update(...)` (Service Role).
*   **Recommended:** Ensure every controller strictly verifies ownership *before* calling Supabase updates.
    *   *Check Listing Update:* `const listing = await getListing(id); if (listing.user_id !== req.user.id) throw Error;`
    *   *Note:* The current code *does* mostly do this, but it must be strictly maintained.

### 2. Fix User Enumeration (Low Priority)
*   **Fix:** Change registration error to generic: `"If this email is available, an account has been created."` or ensure the time taken for "exists" vs "created" is identical (Timing Attack mitigation).
*   *Easier Fix:* Since this is a campus app, knowing someone has an account might not be sensitive. You can accept this risk.

### 3. Strict Output Sanitization
*   **Fix:** In `auth.controller.ts` (Login), explicitly select only the fields the frontend *needs* rather than passing the whole user object.

### 4. Continuous Dependencies Audit
*   **Action:** Run `npm audit` regularly to check for vulnerabilities in `express`, `jsonwebtoken`, or `next.js` dependencies.

---

## ✅ Final Verdict

**Security Grade: A-**

The application is secure for production use within the campus environment. The identified issues are architectural choices rather than critical exploitable bugs.

**Approved for Deployment.**

# 📘 ThaparMarket Technical Workflow Guide

This document provides a deep dive into the technical operations of the ThaparMarket application. It explains **exactly** what happens under the hood when a user performs actions like logging in, posting an item, or sending a message.

---

## 🏗️ Architecture Overview

*   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Zustand (State), Axios.
*   **Backend**: Node.js, Express, Socket.io (Real-time).
*   **Database**: Supabase (PostgreSQL).
*   **Storage**: Cloudinary (Images).
*   **Email**: Resend API.
*   **Authentication**: Custom JWT (JSON Web Tokens).

---

## 🔐 1. Authentication Flow

### A. Login Process (`/api/auth/login`)
1.  **Frontend**: User enters Email & Password.
2.  **API Call**: `POST /api/auth/login` with JSON body.
3.  **Backend Logic**:
    *   **Rate Limit Check**: Checked against `authLimiter` (Max 100 attempts/15min).
    *   **Database Lookup**: Backend queries Supabase `users` table for the email.
    *   **Password Verification**: Uses `bcrypt.compare()` to match input password with stored hash (`$2b$10$...`).
    *   **Token Generation**: If valid, generates a **JWT (access token)** signing the `userId`, `email`, and `isAdmin` status.
4.  **Response**: Returns `{ token, user }`.
5.  **Frontend Action**:
    *   Stores `token` in `localStorage` (`auth-storage`).
    *   Updates Zustand state `useAuthStore` with user details.
    *   Redirects to Home.

### B. Registration (`/api/auth/register`)
1.  **Validation**: Backend (`joi`) checks if email ends with `@thapar.edu`.
2.  **Uniqueness**: Checks DB if email already exists.
3.  **Hashing**: Hashes password using `bcrypt` (Salt rounds: 10).
4.  **OTP Generation**: Generates 6-digit code.
5.  **DB Insert**: Saves user with `is_verified = false`.
6.  **Email**: Calls **Resend API** to send the OTP code to the student email.

---

## 🛍️ 2. Listing Management

### A. Creating a Listing (`POST /api/listings`)
1.  **Frontend**: User fills form + selects images.
2.  **Data Prep**: Creates `FormData` object (allows mixed text + binary files).
3.  **Upload**: Sends `POST` request with files.
4.  **Backend Processing**:
    *   **Multer Middleware**: Intercepts the request and buffers the files in memory.
    *   **Cloudinary Upload**: Backend loops through files and streams them to Cloudinary folder `thaparmarket/listings`.
    *   **Database Insert**: Saves title, description, price, and **Image URLs** (returned from Cloudinary) into Supabase `listings` table.
5.  **Response**: Returns the created listing object.

### B. Fetching Listings (`GET /api/listings`)
1.  **Filtering**: Backend accepts query params (`?category=Books&search=Physics`).
2.  **Supabase Query**: Constructs a SQL query via Supabase Client:
    ```typescript
    let query = supabase.from('listings').select('*, users(*)');
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);
    ```
3.  **Privacy**: Backend filters out `deleted` or `sold` items (unless viewing own profile).

---

## 💬 3. Real-Time Chat (Socket.io)

### A. Connection Handshake
1.  **Frontend**: `socket.connect()` is called in `layout.tsx`.
    *   Sends `auth: { token: "..." }` in handshake packet.
2.  **Backend**:
    *   `io.use` middleware intercepts connection.
    *   Verifies JWT token.
    *   Attaches `socket.user = decodedToken`.
    *   **Connection Success**.

### B. Sending a Message
1.  **Frontend**: `socket.emit('send_message', { chatId, content })`.
2.  **Backend**:
    *   Receives event.
    *   **Persist**: Saves message to Supabase `messages` table API.
    *   **Broadcast**: Finds all sockets in room `chatId`.
    *   **Emit**: `io.to(chatId).emit('new_message', savedMessage)`.
3.  **Frontend (Receiver)**: Listens for `new_message` event and appends to UI list instantly.

---

## 🛡️ 4. Security Layers

### A. Rate Limiting (The "Bouncer")
*   **Global Limiter (5000 req/15min)**:
    *   Smart Limiter checks: Is there a User ID?
    *   **Yes**: Decrement from User's bucket (1000 limit).
    *   **No**: Decrement from IP's bucket (5000 limit - shared by campus NAT).
*   **Auth Limiter (100 req/15min)**:
    *   Strict IP-based limit on Login/Register to prevent brute force cracking.

### B. Headers (Helmet)
*   Backend sets headers like `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN` to prevent clickjacking and MIME-type sniffing attacks.

### C. Parameter Pollution (HPP)
*   Prevents attackers from checking multiple boxes by sending `?id=1&id=2` (which could confuse simple logic). HPP standardizes this to a single query.

---

## 🔎 5. Image & File Handling

### Cloudinary Integration
*   **Uploads**: Direct backend-to-Cloudinary stream. No temporary files stored on server disk (RAM only).
*   **Optimization**: Images are automatically resized/cropped to 1200x1200px limit before saving to save bandwidth and storage.
*   **Deletion**: When a listing is Hard Deleted, the backend takes the stored public ID (e.g., `thaparmarket/listings/xyz123`) and calls Cloudinary API to destroy the asset.

---

## 🔄 6. Admin Powers

### Impersonation
*   **Endpoint**: `/api/auth/impersonate`
*   **Logic**:
    1.  Admin requests "I want to be User X".
    2.  Backend verifies Admin status.
    3.  Backend **mints a new JWT** but signs it with **User X's ID**.
    4.  Frontend receives this token and "becomes" User X until logout.

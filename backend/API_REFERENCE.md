# 🚀 ThaparMarket API Reference

**Base URL:** `http://localhost:5001`  
**Production URL:** TBD

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Listings](#listings)
- [Messages](#messages)
- [Ratings](#ratings)
- [Admin](#admin)

---

## 🔐 Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "student@thapar.edu",
  "password": "SecurePass@123",
  "name": "John Doe",
  "phone": "+91 9876543210",      // Optional
  "department": "Computer Science", // Optional
  "year": 3,                       // Optional
  "hostel": "Hostel A"             // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for verification code.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@thapar.edu",
      "name": "John Doe",
      "is_verified": false
    }
  }
}
```

**Errors:**
- `409` - User already exists
- `500` - Registration failed

---

### Verify Email

Verify email address with OTP code.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "email": "student@thapar.edu",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "student@thapar.edu",
      "name": "John Doe",
      "is_verified": true
    }
  }
}
```

**Errors:**
- `400` - Invalid or expired verification code
- `500` - Verification failed

---

### Resend Verification OTP

Request a new verification code.

**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "student@thapar.edu"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Errors:**
- `404` - User not found
- `400` - Email already verified
- `500` - Failed to resend code

---

### Login

Authenticate user and get JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "student@thapar.edu",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "student@thapar.edu",
      "name": "John Doe",
      "profile_picture": "https://...",
      "is_admin": false,
      "trust_score": "4.50"
    }
  }
}
```

**Errors:**
- `401` - Invalid email or password
- `403` - Account suspended / Email not verified
- `500` - Login failed

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@thapar.edu",
      "name": "John Doe",
      "phone": "+91 9876543210",
      "department": "Computer Science",
      "year": 3,
      "hostel": "Hostel A",
      "profile_picture": "https://...",
      "trust_score": "4.50",
      "is_admin": false,
      "created_at": "2026-01-28T05:07:52.977Z"
    }
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid/expired token)
- `404` - User not found
- `500` - Failed to fetch user data

---

### Request Password Reset

Request a password reset link.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "student@thapar.edu"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

**Note:** Always returns success even if email doesn't exist (security best practice)

---

### Reset Password

Reset password with token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "student@thapar.edu",
  "token": "123456",
  "newPassword": "NewSecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

**Errors:**
- `400` - Invalid or expired reset token
- `500` - Failed to reset password

---

## 👤 Users

### Update Profile

**Endpoint:** `PUT /api/users/profile` *(Coming Soon)*

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+91 9876543210",
  "department": "Computer Science",
  "year": 4,
  "hostel": "Hostel B"
}
```

---

### Upload Profile Picture

**Endpoint:** `POST /api/users/profile-picture` *(Coming Soon)*

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
profile_picture: <file>
```

---

### Get User by ID

**Endpoint:** `GET /api/users/:userId` *(Coming Soon)*

---

## 📦 Listings

### Create Listing

**Endpoint:** `POST /api/listings`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
title: "MacBook Pro 2021"
description: "Excellent condition..."
price: 85000
category_id: 1
condition: "excellent"
listing_type: "sell"
location: "Hostel A"
images: <file[]>
```

---

### Get All Listings

**Endpoint:** `GET /api/listings`

**Query Parameters:**
```
?category=1
&listing_type=sell
&min_price=1000
&max_price=50000
&condition=excellent
&search=macbook
&sort=price_asc
&page=1
&limit=20
```

---

### Get Listing by ID

**Endpoint:** `GET /api/listings/:listingId`

---

### Update Listing

**Endpoint:** `PUT /api/listings/:listingId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

### Delete Listing

**Endpoint:** `DELETE /api/listings/:listingId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

### Mark as Sold/Rented

**Endpoint:** `PATCH /api/listings/:listingId/status`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "status": "sold"
}
```

---

## 💬 Messages

### Send Message

**Endpoint:** `POST /api/messages`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "listing_id": "uuid",
  "receiver_id": "uuid",
  "message": "Is this still available?"
}
```

---

### Get Conversations

**Endpoint:** `GET /api/messages/conversations`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

### Get Messages for Listing

**Endpoint:** `GET /api/messages/listing/:listingId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

## ⭐ Ratings

### Rate User

**Endpoint:** `POST /api/ratings`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "rated_user_id": "uuid",
  "listing_id": "uuid",
  "rating": 5,
  "review": "Great seller! Fast delivery."
}
```

---

### Get User Ratings

**Endpoint:** `GET /api/ratings/user/:userId`

---

## 🛡️ Admin

### Get All Users

**Endpoint:** `GET /api/admin/users`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

---

### Ban/Unban User

**Endpoint:** `PATCH /api/admin/users/:userId/ban`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "is_banned": true,
  "reason": "Spam listings"
}
```

---

### Moderate Listing

**Endpoint:** `PATCH /api/admin/listings/:listingId/moderate`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "status": "approved"
}
```

---

### Get Analytics

**Endpoint:** `GET /api/admin/analytics`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

---

## 🔌 WebSocket Events (Socket.IO)

### Connect

```javascript
const socket = io('http://localhost:5001', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

---

### Join Chat Room

**Event:** `join_chat`

**Payload:**
```javascript
socket.emit('join_chat', 'chat_room_id');
```

---

### Send Message

**Event:** `send_message`

**Payload:**
```javascript
socket.emit('send_message', {
  chatId: 'chat_room_id',
  message: 'Hello!',
  senderId: 'user_id'
});
```

---

### Listen for New Messages

**Event:** `new_message`

```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data);
});
```

---

### Typing Indicator

**Event:** `typing`

**Payload:**
```javascript
socket.emit('typing', {
  chatId: 'chat_room_id',
  userId: 'user_id',
  isTyping: true
});
```

---

### Listen for Typing

**Event:** `user_typing`

```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
});
```

---

## 📝 Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🔑 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Token Expiry:** 7 days

---

## 🚦 Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Response (429):**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

---

## 🌐 CORS

**Allowed Origins:**
- `http://localhost:3000` (Development)
- Production URL (TBD)

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE

**Credentials:** Enabled

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

**Last Updated:** January 29, 2026  
**API Version:** 1.0.0  
**Status:** ✅ All endpoints implemented and tested

# 🎨 ThaparMarket Frontend

Modern, responsive frontend for ThaparMarket - Campus Marketplace for Thapar University.

## 🚀 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Socket.io-client** - Real-time chat
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── verify-email/      # Email verification
│   ├── forgot-password/   # Password reset request
│   ├── reset-password/    # Password reset
│   ├── listings/          # Listing pages
│   │   ├── [id]/         # Listing detail
│   │   └── create/       # Create listing
│   ├── my-listings/       # User's listings
│   ├── messages/          # Chat interface
│   ├── admin/             # Admin dashboard
│   │   └── users/        # User management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── listings/         # Listing components
│   └── chat/             # Chat components
├── lib/                  # Utilities and API client
├── services/             # API services
├── store/                # Zustand stores
└── public/               # Static assets
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on port 5001

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:5001" >> .env.local

# Start development server
npm run dev
```

The app will run on [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🎨 Features

### ✅ Implemented

- **Authentication**
  - Login/Register with validation
  - Email verification (OTP)
  - Password reset
  - Protected routes

- **Marketplace**
  - Browse listings with filters
  - Search functionality
  - Category filters (horizontal chips)
  - Create/Edit/Delete listings
  - Multi-image upload
  - Listing detail view

- **Real-time Chat**
  - Direct messaging
  - Typing indicators
  - Unread count
  - Message history

- **User Features**
  - Profile management
  - My listings
  - Rating system

- **Admin Panel**
  - User management
  - Listing moderation
  - Analytics dashboard

### 🎨 UI/UX Highlights

- Full-width responsive layout
- Search integrated in navbar
- Horizontal category filters
- Improved text contrast
- Better border visibility
- Loading states
- Error handling
- Toast notifications

## 🔧 Configuration

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

### API Client

The API client is configured in `lib/api.ts` with:
- Automatic token handling
- Error handling
- Request/response interceptors

### Socket.IO Client

Real-time features use Socket.IO client configured in `lib/socket.ts`

## 📦 Key Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "zustand": "^4.0.0",
  "socket.io-client": "^4.0.0",
  "react-hot-toast": "^2.0.0",
  "lucide-react": "^0.0.0"
}
```

## 🎯 State Management

Using **Zustand** for global state:

- `authStore` - Authentication state
- User data
- Token management
- Login/logout actions

## 🔐 Authentication Flow

1. User registers → Email sent
2. User verifies email with OTP
3. User logs in → JWT token stored
4. Token included in all API requests
5. Protected routes check auth state

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All components are fully responsive with mobile-first approach.

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Socket.IO](https://socket.io/docs/v4/)

## 👨‍💻 Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (recommended)

### Component Structure

```tsx
'use client';

import { useState } from 'react';

export default function Component() {
  const [state, setState] = useState();
  
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Build Errors

```bash
rm -rf .next
npm run build
```

### API Connection Issues

- Check backend is running on port 5001
- Verify `.env.local` has correct API URL
- Check browser console for errors

---

**Built with ❤️ for Thapar University**

**Last Updated:** January 29, 2026

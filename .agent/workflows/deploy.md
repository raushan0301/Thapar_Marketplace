---
description: How to deploy ThaparMarket for Alpha Testing
---

# 🚀 Deployment Workflow for Alpha Testing

This workflow will guide you through deploying the ThaparMarket application to **Render** (Backend) and **Vercel** (Frontend).

## Prerequisites

1.  **GitHub Repository**: Ensure your latest code is pushed to [your GitHub repository](https://github.com/raushan0301/Thapar_Marketplace).
2.  **Render Account**: Sign up at [render.com](https://render.com).
3.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
4.  **Supabase, Cloudinary, Gmail**: Ensure you have your credentials ready from your local `.env` file.

---

## Step 1: Deploy Backend to Render

1.  Log in to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `thaparmarket-backend`
    *   **Root Directory**: (Leave blank, we handle this in build command)
    *   **Runtime**: `Node`
    *   **Build Command**: `cd backend && npm install && npm run build`
    *   **Start Command**: `cd backend && npm start`
5.  **Environment Variables**: Click **Advanced** and add all variables from `backend/.env`.
    *   **CRITICAL**: Set `NODE_ENV` to `production`.
    *   **CRITICAL**: Set `FRONTEND_URL` to `*` temporarily (or your Vercel URL if you have it).
    *   `PORT` (Render handles this, but set it to `10000` if you want to match `render.yaml`).
6.  Click **Create Web Service**.
7.  **Note the URL**: It will look like `https://thaparmarket-backend.onrender.com`.

---

## Step 2: Deploy Frontend to Vercel

1.  Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Framework Preset**: `Next.js`
    *   **Root Directory**: `frontend`
5.  **Environment Variables**: Add the following:
    *   `NEXT_PUBLIC_API_URL`: `https://thaparmarket-backend.onrender.com` (Use your actual Render URL)
    *   `NEXT_PUBLIC_SOCKET_URL`: `https://thaparmarket-backend.onrender.com`
6.  Click **Deploy**.
7.  **Note the URL**: It will look like `https://thaparmarket-frontend.vercel.app`.

---

## Step 3: Finalize Backend Security (CORS)

1.  Go back to your **Render** dashboard for the backend service.
2.  Go to **Environment**.
3.  Update `FRONTEND_URL` from `*` to your actual Vercel URL (e.g., `https://thapar-marketplace.vercel.app`).
4.  Save changes. Render will redeploy automatically.

---

## Step 4: Alpha Testing Check-list

1.  **Email Verification**: Sign up with a `@thapar.edu` email and check if the OTP arrives.
2.  **Image Uploads**: Create a listing and verify images appear correctly (Cloudinary).
3.  **Real-time Chat**: Test chat between two accounts in separate browser windows.
4.  **Database**: Check Supabase dashboard to see if records are created.

---

## Troubleshooting

- **CORS Error**: Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash).
- **Socket.IO Disconnects**: This is common on Render's free tier. The client will automatically fall back to polling.
- **Build Fails**: Run `npm run build` locally in both `frontend` and `backend` directories to catch errors before pushing.

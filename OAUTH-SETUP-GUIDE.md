# OAuth Setup Guide - Fix Authentication Redirect Issue

## 🚨 Problem
After Google authentication, you're being redirected back to the auth page instead of the main application. This happens because the OAuth callback route is missing and Supabase redirect URLs aren't properly configured.

## ✅ Solution

### Step 1: Configure Supabase OAuth Redirect URLs

1. **Go to your Supabase Dashboard**
   - Navigate to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Configure Authentication Settings**
   - Go to **Authentication** → **URL Configuration**
   - Add these redirect URLs:

   **For Development:**
   ```
   http://localhost:3000/auth/callback
   ```

   **For Production (replace with your actual domain):**
   ```
   https://your-domain.com/auth/callback
   https://your-vercel-app.vercel.app/auth/callback
   ```

3. **Configure Google OAuth Provider**
   - Go to **Authentication** → **Providers**
   - Enable **Google** if not already enabled
   - Add your Google Client ID and Secret
   - Make sure the redirect URL in Google Console matches your Supabase callback URL

### Step 2: Google Console Configuration

1. **Go to Google Cloud Console**
   - Navigate to [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project

2. **Configure OAuth 2.0**
   - Go to **APIs & Services** → **Credentials**
   - Edit your OAuth 2.0 Client ID
   - Add these authorized redirect URIs:

   **For Development:**
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

   **For Production:**
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

### Step 3: Environment Variables

Make sure your `.env.local` has the correct Supabase URL:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Test the Fix

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the authentication flow:**
   - Go to `http://localhost:3000`
   - Click "Continue with Google"
   - Should now redirect to `/mentor` after successful authentication

## 🔧 What Was Fixed

1. **Added OAuth Callback Route** (`/auth/callback/route.ts`)
   - Handles the authentication code exchange
   - Properly redirects users after successful authentication

2. **Updated Redirect URL** in `auth-form.tsx`
   - Changed from `/mentor` to `/auth/callback?next=/mentor`
   - Ensures proper OAuth flow

3. **Supabase Configuration**
   - Added proper redirect URLs in Supabase dashboard
   - Configured Google OAuth provider settings

## 🚀 Deployment Notes

When deploying to production:

1. **Update Supabase redirect URLs** to include your production domain
2. **Update Google Console** with production redirect URIs
3. **Set environment variables** in your hosting platform (Vercel, Netlify, etc.)

## 🐛 Troubleshooting

### Still getting redirected to auth page?
- Check browser console for errors
- Verify Supabase redirect URLs are correct
- Ensure Google OAuth is properly configured
- Check that environment variables are set correctly

### "Invalid redirect URL" error?
- Make sure the redirect URL in your code matches exactly what's configured in Supabase
- Check that your domain is added to the allowed redirect URLs

### Authentication works locally but not in production?
- Verify production environment variables are set
- Check that production domain is added to Supabase redirect URLs
- Ensure Google Console has production redirect URIs

## ✅ Success Checklist

- [ ] OAuth callback route created (`/auth/callback/route.ts`)
- [ ] Supabase redirect URLs configured
- [ ] Google OAuth provider enabled and configured
- [ ] Google Console redirect URIs added
- [ ] Environment variables set correctly
- [ ] Authentication flow works in development
- [ ] Authentication flow works in production

---

**🎉 After completing these steps, your Google authentication should work properly and redirect users to the main application instead of back to the auth page!** 
# Complete Setup Instructions - User Authentication + Chat Persistence

## 🎯 Overview
Your chat application now supports **user authentication** with **personal chat history**. Each user will have their own separate chats stored securely in Supabase.

---

## 📋 Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name: "teachers-next"
4. Choose a strong database password
5. Wait for project to be ready (~2 minutes)

### 1.2 Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database-schema-with-auth.sql`
3. Click **"Run"** to execute the SQL
4. ✅ Verify tables are created: `chats` and `messages` with proper user_id columns

### 1.3 Configure Authentication Providers

#### Enable Email Authentication:
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if desired

#### (Optional) Enable Google OAuth:
1. Go to **Authentication** → **Providers**  
2. Enable **Google**
3. Add your Google Client ID and Secret
4. Add redirect URL: `https://your-domain.com/auth/callback`

---

## 🔐 Step 2: Environment Variables

Create a `.env.local` file in your project root:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Get Supabase Keys:
1. In Supabase dashboard → **Settings** → **API**
2. Copy **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🚀 Step 3: Test the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test Authentication Flow:**
   - Go to `http://localhost:3000`
   - Should redirect to `/auth`
   - Try signing up with email/password
   - Check email for confirmation link
   - Sign in after confirmation
   - Should redirect to `/mentor`

3. **Test Chat Persistence:**
   - Go to `/mentor` → Click "Continue Previous Chat"
   - Start a conversation
   - Check Supabase dashboard → **Table Editor** → verify data in `chats` and `messages` tables
   - Sign out and sign back in → verify chat history loads

---

## 🏗️ Architecture Overview

### **URL Structure:**
- `/auth` - Sign in/Sign up page
- `/mentor` - Main mentor page (protected)
- `/mentor/chat` - Creates new chat (protected)
- `/mentor/chat/[chatid]` - Specific chat conversation (protected)

### **Authentication Flow:**
```
1. User visits any protected route
2. If not authenticated → redirect to /auth
3. User signs in/up
4. If authenticated → redirect to /mentor
5. All chats are user-specific via user_id
```

### **Database Security:**
- **Row Level Security (RLS)** enabled
- Users can only see/modify their own chats and messages
- Automatic `user_id` assignment via database triggers

### **Components:**
- `AuthProvider` - Manages auth state
- `ProtectedLayout` - Route protection
- `ChatHistorySidebar` - Shows user's chat history
- `PersistentChat` - Chat with message persistence

---

## 🔒 Security Features

✅ **User Isolation** - Each user only sees their own chats  
✅ **Server-side Auth** - API routes verify authentication  
✅ **Row Level Security** - Database-level protection  
✅ **Auto user_id** - Automatic assignment via triggers  
✅ **Protected Routes** - Unauthenticated users redirected  

---

## 🎨 User Experience

### **First-time User:**
1. Visits app → redirected to sign-up
2. Creates account → email confirmation
3. Signs in → goes to mentor page
4. Starts first chat → automatically saved

### **Returning User:**
1. Visits app → automatically signed in (if session valid)
2. Goes to mentor page → sees "Continue Previous Chat"
3. Sidebar shows all previous chats
4. Can click any chat to continue conversation

---

## 🛠️ Troubleshooting

### **"User must be authenticated" errors:**
- Check environment variables are set correctly
- Verify Supabase project URL and anon key
- Make sure user is signed in

### **Database permission errors:**
- Verify RLS policies are created correctly
- Check that user_id triggers are working
- Run the SQL schema again if needed

### **Auth redirect loops:**
- Clear browser cookies and local storage
- Check that environment variables don't have trailing spaces
- Verify Supabase project is active

### **Google OAuth not working:**
- Add correct redirect URLs in Google Console
- Verify Client ID and Secret in Supabase
- Check domain allowlist

---

## ✅ Success Checklist

- [ ] Supabase project created and configured
- [ ] Database schema executed successfully  
- [ ] Environment variables set correctly
- [ ] Authentication working (sign up/in/out)
- [ ] Chat persistence working
- [ ] User-specific chat history visible
- [ ] Protected routes working
- [ ] Sidebar shows user info and sign-out

**🎉 Your chat application now has full user authentication with personal chat history!** 
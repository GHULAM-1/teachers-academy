# Environment Variables Setup

## `.env.local` File Structure

Create a file named `.env.local` in your project root with the following content:

```env
# ===================================
# Teachers Academy Environment Variables
# ===================================

# AI Model Configuration
# Choose ONE of the following:

# Option 1: OpenAI (if you want to use ChatGPT models)
# Get this from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_actual_openai_api_key_here

# Option 2: Google AI (if you want to use Gemini models) - Currently Active
# Get this from: https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_google_ai_api_key_here

# Supabase Configuration
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_anon_key_here

# Supabase Service Role Key (for server-side operations)
# ⚠️ KEEP THIS SECRET! Only for server-side use
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## How to Get Each Key:

### 1a. OpenAI API Key (Optional)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in to your account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-proj-` or `sk-`)
6. Paste as `OPENAI_API_KEY` value

### 1b. Google AI API Key (Currently Active)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key
5. Paste as `GOOGLE_GENERATIVE_AI_API_KEY` value

### 2. Supabase Project URL
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
5. Paste as `NEXT_PUBLIC_SUPABASE_URL` value

### 3. Supabase Anon Key
1. In the same **Settings** → **API** page
2. Copy the **anon public** key (long JWT token)
3. Paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` value

### 4. Supabase Service Role Key (Optional but Recommended)
1. In the same **Settings** → **API** page
2. Copy the **service_role** key (⚠️ This is secret - keep it safe!)
3. Paste as `SUPABASE_SERVICE_ROLE_KEY` value

## Example with Real Format:

```env
# Example (replace with your actual values)
# Currently using Google AI - only need this one:
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567890

# Optional - only if switching back to OpenAI:
# OPENAI_API_KEY=sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890

NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjc2ODAwMCwiZXhwIjoxOTQ4MzQ0MDAwfQ.example_signature_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjMyNzY4MDAwLCJleHAiOjE5NDgzNDQwMDB9.service_role_signature_here
```

## Important Notes:

- ⚠️ **Never commit `.env.local` to version control**
- ⚠️ **Keep your API keys secret**
- ⚠️ **Use different keys for development and production**
- 🔄 **Restart your dev server after changing environment variables**
- ✅ **The file should be in your project root (same level as `package.json`)**

## File Location:
```
teachers-academy/
├── .env.local          ← Create this file here
├── package.json
├── src/
└── ...
``` 
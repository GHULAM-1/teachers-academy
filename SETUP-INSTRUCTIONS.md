# Setup Instructions - Chat Persistence

## 1. Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### Run Database Schema
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the contents of `database-schema.sql` 
4. Click "Run" to execute the SQL

### Get API Keys
1. In your Supabase dashboard, go to "Settings" → "API"
2. Copy your project URL and anon public key

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
# OpenAI API Key (if not already set)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 3. Test the Setup

After completing the above steps, restart your development server:

```bash
npm run dev
```

The chat persistence should now work! 

## What's Next

We're implementing this step by step following the Vercel AI SDK documentation pattern:
- ✅ Database schema created
- ✅ Chat store functions created  
- 🔄 Currently working on: API route updates
- ⏳ Coming next: Chat routing and UI updates 
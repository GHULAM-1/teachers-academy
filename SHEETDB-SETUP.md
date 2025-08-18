# SheetDB Integration Setup

## Environment Variables

Add this to your `.env.local` file:

```env
SHEETDB_URL=https://sheetdb.io/api/v1/YOUR_ACTUAL_SHEET_ID
```

**Note:** This single URL is used for both mentor and career flows.

## SheetDB Sheet Structure

Your SheetDB sheet should have these columns:
- `id` - Row ID
- `config_key` - Configuration key name
- `config_value` - Configuration value
- `description` - Description of the config

## Required Rows

| id | config_key | config_value | description |
|----|------------|--------------|-------------|
| 1 | main_flow_prompt | [Your main flow prompt] | Main conversation prompt |
| 2 | stuck_mode_prompt | [Your stuck mode prompt] | Prompt for immediate help mode |
| 3 | trigger_words | begin,start | Comma-separated words that start conversation |
| 4 | phase_names | assessment,recommendation,guidance | Comma-separated names of conversation phases |

## What's Been Updated

### Mentor Flow
1. ✅ **Created** `src/lib/mentor-config.ts` - Configuration service
2. ✅ **Updated** `src/app/api/chat/route.ts` - Main chat API now uses SheetDB
3. ✅ **Updated** `src/app/api/chat/stuck/route.ts` - Stuck mode API now uses SheetDB

### Career Flow
4. ✅ **Created** `src/lib/career-config.ts` - Configuration service
5. ✅ **Updated** `src/app/api/career/route.ts` - Career API now uses SheetDB
6. ✅ **Removed** hardcoded discovery questions and job matching logic
7. ✅ **Implemented** AI-driven discovery process

### General
8. ✅ **Removed** all hardcoded prompts from code
9. ✅ **Added** dynamic prompt replacement with user profile data

## Testing

1. Start your development server
2. Test the mentor flow - should use prompts from SheetDB
3. Make a change in SheetDB and test if it appears
4. Verify no more hardcoded logic in the code

## Next Steps

1. Add your actual SheetDB URL to `.env.local`
2. Test the integration
3. Update prompts in SheetDB as needed

## Career Flow Configuration

For the career flow, your SheetDB should have these additional columns:

| config_key | config_value | description |
|------------|--------------|-------------|
| discover_step_prompt | "You are guiding the user through..." | AI-driven discovery process prompt |
| commit_step_prompt | "You are now serving as a Mindset Coach..." | Mindset coaching prompt |
| create_step_prompt | "You are helping the user prepare..." | Materials creation prompt |
| career_steps | "discover,commit,create,apply" | Comma-separated career flow steps |
| job_search_terms_prompt | "Generate job search terms..." | Job search terms generation prompt |

**Important Notes:**
- `career_steps` should be a comma-separated string: "discover,commit,create,apply"
- `discover_step_prompt` now handles the entire AI-driven discovery process
- No more hardcoded discovery questions - AI asks questions naturally
- AI determines when enough information is gathered (usually 5-12 questions)
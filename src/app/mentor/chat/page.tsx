import { redirect } from 'next/navigation';

/**
 * /mentor/chat should redirect to /mentor to avoid duplicate chat creation
 * /mentor will handle chat creation and redirect to /mentor/chat/[chatId]
 */
export default async function Page() {
  // Simply redirect to /mentor which will handle chat creation
  redirect('/mentor');
} 
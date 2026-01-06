import { redirect } from 'next/navigation';

export default async function ForgotPasswordPage() {
  // Redirect to locale-independent forgot-password page
  redirect('/auth/forgot-password');
}

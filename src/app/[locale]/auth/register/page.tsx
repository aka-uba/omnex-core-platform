import { redirect } from 'next/navigation';

export default async function RegisterPage() {
  // Redirect to locale-independent register page
  redirect('/auth/register');
}






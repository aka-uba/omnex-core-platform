import { redirect } from 'next/navigation';

export default async function LoginPage() {
  // Redirect to locale-independent login page
  redirect('/auth/login');
}






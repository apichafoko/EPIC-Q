import { redirect } from 'next/navigation';

export default function RootPage() {
  console.log('🏠 RootPage ejecutándose - redirigiendo a /es');
  redirect('/es');
}
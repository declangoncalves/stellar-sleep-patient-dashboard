// frontend/app/page.tsx (Next 13+ with app router)

'use client';
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/patients');
}

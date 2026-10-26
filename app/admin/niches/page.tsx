import { redirect } from 'next/navigation';

// Tela movida para Admin → Landing page
export default function Moved() {
  redirect('/admin/landing?tab=niches');
}

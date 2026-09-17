import { cookies } from 'next/headers';
import { DashboardApp } from './dashboard-app';

export default async function DashboardPage() {
  const store = await cookies();
  const isAdmin =
    store.get('staff_session')?.value === process.env.ADMIN_SESSION_TOKEN;
  return <DashboardApp isAdmin={isAdmin} />;
}
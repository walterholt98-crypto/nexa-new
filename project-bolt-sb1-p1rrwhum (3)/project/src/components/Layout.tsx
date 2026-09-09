import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';

export function Layout() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

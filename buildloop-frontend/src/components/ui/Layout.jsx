import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/20 selection:text-foreground">
      <Navbar />
      <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

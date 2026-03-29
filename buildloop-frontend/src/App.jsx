import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import Layout from '@/components/ui/Layout';
import PageLoader from '@/components/ui/PageLoader';

const Dashboard  = lazy(() => import('@/pages/Dashboard'));
const Feedback   = lazy(() => import('@/pages/Feedback'));
const Insights   = lazy(() => import('@/pages/Insights'));
const Features   = lazy(() => import('@/pages/Features'));
const Kanban     = lazy(() => import('@/pages/Kanban'));
const Workspace  = lazy(() => import('@/pages/Workspace'));

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-white/70 mb-6">
            Missing Clerk configuration. Set <code className="bg-white/10 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="bg-white/10 px-2 py-1 rounded">buildloop-frontend/.env</code>
          </p>
          <p className="text-white/50 text-sm">
            Get your key from <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-brand-light hover:text-brand underline">Clerk Dashboard</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index         element={<Dashboard />}  />
              <Route path="/feedback"  element={<Feedback />}   />
              <Route path="/insights"  element={<Insights />}   />
              <Route path="/features"  element={<Features />}   />
              <Route path="/kanban"    element={<Kanban />}     />
              <Route path="/workspace" element={<Workspace />}  />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ClerkProvider>
  );
}

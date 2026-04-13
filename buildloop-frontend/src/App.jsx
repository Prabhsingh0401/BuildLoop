import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import Layout from '@/components/ui/Layout';
import PageLoader from '@/components/ui/PageLoader';

const delayedLazy = (importFunc, minDelay = 2000) => {
  return lazy(() => 
    Promise.all([
      importFunc(),
      new Promise(resolve => setTimeout(resolve, minDelay))
    ]).then(([moduleExports]) => moduleExports)
  );
};

const Dashboard  = delayedLazy(() => import('@/pages/Dashboard'));
const Feedback   = delayedLazy(() => import('@/pages/Feedback'));
const Insights   = delayedLazy(() => import('@/pages/Insights'));
const Features   = delayedLazy(() => import('@/pages/Features'));
const Kanban     = delayedLazy(() => import('@/pages/Kanban'));
const Workspace  = delayedLazy(() => import('@/pages/Workspace'));

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

import { Toaster } from 'sonner';

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
      <Toaster position="top-right" richColors />
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

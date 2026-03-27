import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/ui/Layout';
import PageLoader from '@/components/ui/PageLoader';

const Dashboard  = lazy(() => import('@/pages/Dashboard'));
const Feedback   = lazy(() => import('@/pages/Feedback'));
const Insights   = lazy(() => import('@/pages/Insights'));
const Features   = lazy(() => import('@/pages/Features'));
const Kanban     = lazy(() => import('@/pages/Kanban'));
const Workspace  = lazy(() => import('@/pages/Workspace'));

export default function App() {
  return (
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
  );
}

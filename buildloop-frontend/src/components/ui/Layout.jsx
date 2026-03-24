import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#030303] font-sans text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0 bg-[#060608]">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative mt-14 custom-scrollbar">
          <div className="min-h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

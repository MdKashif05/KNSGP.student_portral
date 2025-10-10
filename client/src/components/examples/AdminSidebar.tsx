import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from '../AdminSidebar';
import { useState } from 'react';

export default function AdminSidebarExample() {
  const [activeItem, setActiveItem] = useState('dashboard');

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar 
          activeItem={activeItem}
          onNavigate={(item) => setActiveItem(item)}
          onLogout={() => console.log('Logout')}
        />
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-bold">Active Section: {activeItem}</h2>
        </div>
      </div>
    </SidebarProvider>
  );
}

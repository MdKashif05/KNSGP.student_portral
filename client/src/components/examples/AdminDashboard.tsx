import AdminDashboard from '../AdminDashboard';

export default function AdminDashboardExample() {
  return (
    <AdminDashboard
      adminName="Md Kashif"
      onLogout={() => console.log('Logout')}
    />
  );
}

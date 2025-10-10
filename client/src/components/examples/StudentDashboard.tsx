import StudentDashboard from '../StudentDashboard';

export default function StudentDashboardExample() {
  return (
    <StudentDashboard
      studentName="Bhaskar Kumar"
      rollNo="2023-CSE-01"
      onLogout={() => console.log('Logout')}
    />
  );
}

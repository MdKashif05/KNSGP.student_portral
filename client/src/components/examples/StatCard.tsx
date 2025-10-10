import StatCard from '../StatCard';
import { Users, TrendingUp, BookOpen, Award } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatCard
        title="Total Students"
        value="39"
        icon={Users}
        description="Active enrollments"
      />
      <StatCard
        title="Avg Attendance"
        value="85.2%"
        icon={TrendingUp}
        trend={{ value: 3.5, isPositive: true }}
      />
      <StatCard
        title="Books Issued"
        value="127"
        icon={BookOpen}
        description="Currently checked out"
      />
      <StatCard
        title="Avg Marks"
        value="78.4"
        icon={Award}
        trend={{ value: 2.1, isPositive: true }}
      />
    </div>
  );
}

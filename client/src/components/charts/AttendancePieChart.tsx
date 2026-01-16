import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AttendancePieChartProps {
  data: any[];
}

export default function AttendancePieChart({ data = [] }: AttendancePieChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  // Calculate distribution
  const statusCounts = safeData.reduce((acc: any, record: any) => {
    const status = record.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Good (>80%)', value: statusCounts['Good'] || 0, color: 'hsl(var(--success))' }, // Green
    { name: 'Average (60-80%)', value: statusCounts['Average'] || 0, color: 'hsl(var(--warning))' }, // Yellow/Orange
    { name: 'Poor (<60%)', value: statusCounts['Poor'] || 0, color: 'hsl(var(--destructive))' }, // Red
  ].filter(item => item.value > 0);

  return (
    <Card className="hover-lift smooth-transition">
      <CardHeader>
        <CardTitle className="smooth-transition">Attendance Status</CardTitle>
        <CardDescription className="smooth-transition">Student attendance categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

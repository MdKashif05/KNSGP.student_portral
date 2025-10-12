import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AttendanceOverviewChartProps {
  data: any[];
}

export default function AttendanceOverviewChart({ data }: AttendanceOverviewChartProps) {
  // Process data to get monthly attendance stats
  const monthlyData = data.reduce((acc: any, record: any) => {
    const month = new Date(record.markedAt).toLocaleDateString('en-US', { month: 'short' });
    
    if (!acc[month]) {
      acc[month] = { month, present: 0, absent: 0, total: 0 };
    }
    
    if (record.status === 'present') {
      acc[month].present++;
    } else {
      acc[month].absent++;
    }
    acc[month].total++;
    
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).map((item: any) => ({
    month: item.month,
    present: item.present,
    absent: item.absent,
    percentage: ((item.present / item.total) * 100).toFixed(1),
  }));

  return (
    <Card className="hover-lift smooth-transition">
      <CardHeader>
        <CardTitle className="smooth-transition">Attendance Overview</CardTitle>
        <CardDescription className="smooth-transition">Monthly attendance trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="present" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Present"
            />
            <Line 
              type="monotone" 
              dataKey="absent" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Absent"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

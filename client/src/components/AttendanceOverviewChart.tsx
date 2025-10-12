import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AttendanceOverviewChartProps {
  data: any[];
}

export default function AttendanceOverviewChart({ data }: AttendanceOverviewChartProps) {
  // Process monthly aggregate data
  // Group by month and sum present/absent days across all students and subjects
  const monthlyData = data.reduce((acc: any, record: any) => {
    // Use the month field directly (format: "YYYY-MM")
    const month = record.month ? record.month.substring(5) : 'Unknown'; // Extract MM from YYYY-MM
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    
    if (!acc[record.month]) {
      acc[record.month] = { 
        month: monthName, 
        present: 0, 
        absent: 0, 
        total: 0 
      };
    }
    
    acc[record.month].present += record.presentDays || 0;
    acc[record.month].total += record.totalDays || 0;
    acc[record.month].absent += (record.totalDays - record.presentDays) || 0;
    
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).map((item: any) => ({
    month: item.month,
    present: item.present,
    absent: item.absent,
    percentage: item.total > 0 ? ((item.present / item.total) * 100).toFixed(1) : '0',
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

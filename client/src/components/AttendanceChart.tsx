import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AttendanceChartProps {
  data: Array<{
    subject: string;
    present: number;
    absent: number;
  }>;
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance by Subject</CardTitle>
        <CardDescription>Present vs Absent comparison across all subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="subject" 
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
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey="present" fill="hsl(var(--chart-2))" name="Present" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" fill="hsl(var(--chart-3))" name="Absent" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

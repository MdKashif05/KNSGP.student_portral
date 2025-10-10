import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MarksChartProps {
  data: Array<{
    test: string;
    student: number;
    classAvg: number;
  }>;
}

export default function MarksChart({ data }: MarksChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marks Trend</CardTitle>
        <CardDescription>Your performance vs class average over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="test" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="student" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              name="Your Marks"
              dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="classAvg" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              name="Class Average"
              dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

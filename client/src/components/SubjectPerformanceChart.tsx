import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SubjectPerformanceChartProps {
  marks: any[];
  subjects: any[];
}

export default function SubjectPerformanceChart({ marks, subjects }: SubjectPerformanceChartProps) {
  // Calculate average marks per subject
  const subjectPerformance = subjects.map((subject: any) => {
    const subjectMarks = marks.filter((mark: any) => mark.subjectId === subject.id);
    const avgMarks = subjectMarks.length > 0
      ? subjectMarks.reduce((sum: number, mark: any) => sum + (mark.midterm + mark.endterm + mark.internal), 0) / subjectMarks.length
      : 0;

    return {
      name: subject.code || subject.name,
      average: parseFloat(avgMarks.toFixed(1)),
      students: subjectMarks.length,
    };
  });

  return (
    <Card className="hover-lift smooth-transition">
      <CardHeader>
        <CardTitle className="smooth-transition">Subject Performance</CardTitle>
        <CardDescription className="smooth-transition">Average marks by subject</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectPerformance}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={80}
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
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="average" 
              fill="hsl(var(--chart-1))" 
              radius={[8, 8, 0, 0]}
              name="Average Marks"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

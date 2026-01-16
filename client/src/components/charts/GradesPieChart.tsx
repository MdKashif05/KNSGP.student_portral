import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface GradesPieChartProps {
  data: any[];
}

export default function GradesPieChart({ data = [] }: GradesPieChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  // Calculate distribution
  const gradeCounts = safeData.reduce((acc: any, record: any) => {
    let gradeGroup = 'Other';
    const grade = record.grade || '';
    
    if (['A+', 'A'].includes(grade)) gradeGroup = 'Excellent (A/A+)';
    else if (['B+', 'B'].includes(grade)) gradeGroup = 'Good (B/B+)';
    else if (['C'].includes(grade)) gradeGroup = 'Average (C)';
    else if (['D', 'F'].includes(grade)) gradeGroup = 'Poor (D/F)';
    
    acc[gradeGroup] = (acc[gradeGroup] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Excellent (A/A+)', value: gradeCounts['Excellent (A/A+)'] || 0, color: 'hsl(var(--success))' },
    { name: 'Good (B/B+)', value: gradeCounts['Good (B/B+)'] || 0, color: 'hsl(var(--primary))' },
    { name: 'Average (C)', value: gradeCounts['Average (C)'] || 0, color: 'hsl(var(--warning))' },
    { name: 'Poor (D/F)', value: gradeCounts['Poor (D/F)'] || 0, color: 'hsl(var(--destructive))' },
  ].filter(item => item.value > 0);

  return (
    <Card className="hover-lift smooth-transition">
      <CardHeader>
        <CardTitle className="smooth-transition">Grade Distribution</CardTitle>
        <CardDescription className="smooth-transition">Overall academic performance</CardDescription>
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

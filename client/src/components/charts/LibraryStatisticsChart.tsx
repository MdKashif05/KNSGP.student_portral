import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LibraryStatisticsChartProps {
  books: any[];
}

export default function LibraryStatisticsChart({ books = [] }: LibraryStatisticsChartProps) {
  // Ensure books is an array
  const safeBooks = Array.isArray(books) ? books : [];

  const totalBooks = safeBooks.reduce((sum: number, book: any) => sum + (book.totalCopies || 0), 0);
  const availableBooks = safeBooks.reduce((sum: number, book: any) => sum + (book.availableCopies || 0), 0);
  const issuedBooks = totalBooks - availableBooks;

  const data = [
    { name: 'Available', value: availableBooks, color: 'hsl(var(--chart-2))' },
    { name: 'Issued', value: issuedBooks, color: 'hsl(var(--chart-1))' },
  ];

  return (
    <Card className="hover-lift smooth-transition">
      <CardHeader>
        <CardTitle className="smooth-transition">Library Statistics</CardTitle>
        <CardDescription className="smooth-transition">Book availability overview</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
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
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-muted rounded-lg smooth-transition">
            <div className="text-2xl font-bold text-primary">{totalBooks}</div>
            <div className="text-xs text-muted-foreground">Total Books</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg smooth-transition">
            <div className="text-2xl font-bold text-primary">{books.length}</div>
            <div className="text-xs text-muted-foreground">Book Titles</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

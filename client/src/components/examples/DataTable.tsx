import DataTable from '../DataTable';
import { Badge } from '@/components/ui/badge';

export default function DataTableExample() {
  const columns = [
    { key: 'rollNo', label: 'Roll Number' },
    { key: 'name', label: 'Name' },
    { 
      key: 'attendance', 
      label: 'Attendance',
      render: (value: number) => (
        <Badge variant={value >= 75 ? 'default' : 'destructive'}>
          {value}%
        </Badge>
      )
    },
    { key: 'avgMarks', label: 'Avg Marks' },
    { key: 'booksIssued', label: 'Books Issued' },
  ];

  const data = [
    { rollNo: '2023-CSE-01', name: 'Bhaskar Kumar', attendance: 85, avgMarks: 78, booksIssued: 2 },
    { rollNo: '2023-CSE-03', name: 'Subhash Kumar', attendance: 72, avgMarks: 82, booksIssued: 1 },
    { rollNo: '2023-CSE-04', name: 'Prithvi Kumar Singh', attendance: 90, avgMarks: 88, booksIssued: 3 },
    { rollNo: '2023-CSE-05', name: 'Aniket Kumar', attendance: 68, avgMarks: 75, booksIssued: 0 },
  ];

  return (
    <DataTable
      title="Student Details"
      description="Complete overview of all students"
      columns={columns}
      data={data}
      actions={true}
      onEdit={(row) => console.log('Edit:', row)}
      onDelete={(row) => console.log('Delete:', row)}
    />
  );
}

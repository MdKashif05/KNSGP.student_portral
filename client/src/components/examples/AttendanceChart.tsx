import AttendanceChart from '../AttendanceChart';

export default function AttendanceChartExample() {
  const mockData = [
    { subject: 'Programming in C', present: 32, absent: 7 },
    { subject: 'Data Structures', present: 35, absent: 4 },
    { subject: 'DBMS', present: 30, absent: 9 },
    { subject: 'Web Dev', present: 36, absent: 3 },
    { subject: 'OS', present: 28, absent: 11 },
  ];

  return <AttendanceChart data={mockData} />;
}

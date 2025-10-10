import MarksChart from '../MarksChart';

export default function MarksChartExample() {
  const mockData = [
    { test: 'Test 1', student: 75, classAvg: 68 },
    { test: 'Test 2', student: 82, classAvg: 72 },
    { test: 'Mid-term', student: 78, classAvg: 74 },
    { test: 'Test 3', student: 85, classAvg: 76 },
    { test: 'Final', student: 88, classAvg: 79 },
  ];

  return <MarksChart data={mockData} />;
}

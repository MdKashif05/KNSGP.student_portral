import LibraryBookCard from '../LibraryBookCard';

export default function LibraryBookCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <LibraryBookCard
        title="Introduction to Algorithms"
        author="Thomas H. Cormen"
        copiesAvailable={3}
        totalCopies={5}
        onIssue={() => console.log('Issue book')}
      />
      <LibraryBookCard
        title="Database System Concepts"
        author="Abraham Silberschatz"
        copiesAvailable={0}
        totalCopies={4}
        onIssue={() => console.log('Issue book')}
      />
      <LibraryBookCard
        title="Operating System Concepts"
        author="Abraham Silberschatz"
        copiesAvailable={2}
        totalCopies={3}
        onIssue={() => console.log('Issue book')}
      />
    </div>
  );
}

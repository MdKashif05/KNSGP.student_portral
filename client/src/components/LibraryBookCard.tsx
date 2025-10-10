import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LibraryBookCardProps {
  title: string;
  author: string;
  copiesAvailable: number;
  totalCopies: number;
  onIssue?: () => void;
}

export default function LibraryBookCard({ 
  title, 
  author, 
  copiesAvailable, 
  totalCopies,
  onIssue 
}: LibraryBookCardProps) {
  const isAvailable = copiesAvailable > 0;

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
            <CardDescription className="text-sm mt-1">{author}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isAvailable ? "default" : "destructive"}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {copiesAvailable}/{totalCopies} copies
            </span>
          </div>
          {isAvailable && onIssue && (
            <Button 
              size="sm" 
              onClick={onIssue}
              data-testid={`button-issue-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <BookMarked className="h-4 w-4 mr-1" />
              Issue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

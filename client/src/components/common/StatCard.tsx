import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card className="hover-elevate hover-lift smooth-transition group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1 smooth-transition">{title}</p>
            <h3 className="text-3xl font-bold text-foreground smooth-transition group-hover:text-primary" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
              {value}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-2 smooth-transition">{description}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2 smooth-transition">
                <span className={`text-xs font-medium ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground ml-2">vs last month</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center smooth-transition group-hover:bg-primary/20">
            <Icon className="h-6 w-6 text-primary smooth-transition" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

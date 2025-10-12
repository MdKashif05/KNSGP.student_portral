import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  actions?: boolean;
}

export default function DataTable({ 
  title, 
  description, 
  columns, 
  data, 
  onEdit, 
  onDelete,
  actions = false 
}: DataTableProps) {
  return (
    <Card className="hover-lift smooth-transition">
      <CardHeader>
        <CardTitle className="smooth-transition">{title}</CardTitle>
        {description && <CardDescription className="smooth-transition">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="smooth-transition">
                {columns.map((column) => (
                  <TableHead key={column.key} className="smooth-transition">{column.label}</TableHead>
                ))}
                {actions && <TableHead className="text-right smooth-transition">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="hover-elevate smooth-transition group">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="smooth-transition">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right smooth-transition">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onEdit(row)}
                            data-testid={`button-edit-${index}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDelete(row)}
                            data-testid={`button-delete-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

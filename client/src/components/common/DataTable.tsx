import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useVirtualizer } from "@tanstack/react-virtual";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  actions?: boolean;
  selectableRows?: boolean;
  selectedRowIds?: (string | number)[];
  getRowId?: (row: any) => string | number;
  onToggleRow?: (row: any) => void;
  onToggleAll?: () => void;
  pagination?: PaginationProps;
  enableVirtualization?: boolean;
}

export default function DataTable({ 
  title, 
  description, 
  columns, 
  data, 
  onEdit, 
  onDelete,
  actions = false,
  selectableRows = false,
  selectedRowIds,
  getRowId,
  onToggleRow,
  onToggleAll,
  pagination,
  enableVirtualization = false
}: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const effectiveGetRowId = getRowId ?? ((row: any) => row.id);
  const selectedSet = new Set(selectedRowIds ?? []);
  const allRowIds = data.map((row) => effectiveGetRowId(row));
  const allSelected = data.length > 0 && allRowIds.every((id) => selectedSet.has(id));
  const someSelected = data.length > 0 && !allSelected && data.some((row) => selectedSet.has(effectiveGetRowId(row)));

  const { getVirtualItems, getTotalSize } = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const virtualItems = getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;

  const renderRow = (row: any, index: number) => (
    <TableRow key={index} className="hover-elevate smooth-transition group">
      {selectableRows && (
        <TableCell className="w-[40px] smooth-transition">
          <Checkbox
            checked={selectedSet.has(effectiveGetRowId(row))}
            onCheckedChange={() => onToggleRow && onToggleRow(row)}
            aria-label="Select row"
          />
        </TableCell>
      )}
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
  );

  return (
    <Card className="hover-lift smooth-transition flex flex-col h-full">
      <CardHeader>
        <CardTitle className="smooth-transition">{title}</CardTitle>
        {description && <CardDescription className="smooth-transition">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div 
          ref={parentRef} 
          className="w-full overflow-auto border rounded-md"
          style={{ height: enableVirtualization ? '100%' : 'auto', maxHeight: enableVirtualization ? 'none' : 'auto' }}
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="smooth-transition">
                {selectableRows && (
                  <TableHead className="w-[40px] smooth-transition">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={() => onToggleAll && onToggleAll()}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.key} className="smooth-transition">{column.label}</TableHead>
                ))}
                {actions && <TableHead className="text-right smooth-transition">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {enableVirtualization && paddingTop > 0 && (
                <TableRow style={{ height: `${paddingTop}px` }}>
                  <TableCell colSpan={columns.length + (selectableRows ? 1 : 0) + (actions ? 1 : 0)} />
                </TableRow>
              )}
              
              {!enableVirtualization ? (
                 data.map((row, index) => renderRow(row, index))
              ) : (
                 virtualItems.map((virtualRow) => {
                  const row = data[virtualRow.index];
                  if (!row) return null;
                  return renderRow(row, virtualRow.index); // Use index for key? Or virtualRow.key? 
                  // Ideally use virtualRow.index as part of key if needed, but renderRow uses index as key.
                  // Let's modify renderRow call to just return the row content, or inline it.
                  // Actually renderRow uses index for key. Let's pass virtualRow.index.
                 })
              )}
              
              {enableVirtualization && paddingBottom > 0 && (
                <TableRow style={{ height: `${paddingBottom}px` }}>
                  <TableCell colSpan={columns.length + (selectableRows ? 1 : 0) + (actions ? 1 : 0)} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

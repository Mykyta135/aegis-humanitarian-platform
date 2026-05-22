"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteResource } from "@/hooks/use-delete-resource";
import { useDeleteVolunteer } from "@/hooks/use-delete-volunteer";
import { useResources, type Resource } from "@/hooks/use-resources";
import { useVolunteers, type Volunteer } from "@/hooks/use-volunteers";
import { useAuthStore } from "@/stores/use-auth.store";
import {
  ArrowUpDown,
  ChevronDown,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { CreateVolunteerForm } from "@/components/dashboard/CreateVolounteerForm";
import { CreateResourceForm } from "@/components/dashboard/CreateResourceForm";

// ── Volunteer columns ──
const volunteerColumns: ColumnDef<Volunteer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    id: "email",
    accessorFn: (row) => (row as any).email ?? "—",
    header: "Email",
    cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as string}</span>,
  },
  {
    accessorKey: "experienceLevel",
    header: "Experience",
    cell: ({ getValue }) => <Badge variant="outline">{(getValue() as string) ?? "—"}</Badge>,
    filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <Badge variant={status === "available" ? "default" : "secondary"}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
  },
  {
    accessorKey: "skills",
    header: "Skills",
    cell: ({ getValue }) => (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {(getValue() as string[]).map((s) => (
          <Badge key={s} variant="outline" className="text-[10px] h-4 px-1">
            {s}
          </Badge>
        ))}
      </div>
    ),
    enableSorting: false,
    filterFn: (row, id, value) => {
      if (value === "all") return true;
      return (row.getValue(id) as string[]).includes(value);
    },
  },
];

// ── Resource columns ──
const resourceColumns: ColumnDef<Resource>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="px-0" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => <Badge variant="outline">{(getValue() as string)?.replace("_", " ") ?? "—"}</Badge>,
    filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
  },
  {
    accessorKey: "condition",
    header: "Condition",
    cell: ({ getValue }) => {
      const c = getValue() as string | undefined;
      return <span className="text-sm text-muted-foreground">{c?.replace("_", " ") ?? "—"}</span>;
    },
    filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <Badge variant={status === "available" ? "default" : "secondary"}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => value === "all" || row.getValue(id) === value,
  },
  {
    id: "location",
    accessorFn: (row) =>
      row.location ? `${row.location.lat.toFixed(3)}, ${row.location.lng.toFixed(3)}` : "—",
    header: "Location",
    cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as string}</span>,
    enableSorting: false,
  },
];

// ── Generic DataTable ──
function DataTable<T>({
  columns,
  data,
  isLoading,
  onDelete,
  isDeleting,
  filters,
  searchPlaceholder,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading: boolean;
  onDelete: (item: T) => void;
  isDeleting: boolean;
  filters: { id: string; label: string; options: { label: string; value: string }[] }[];
  searchPlaceholder: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const allColumns: ColumnDef<T>[] = [
    ...columns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The record will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(row.original)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const hasActiveFilters = columnFilters.length > 0 || globalFilter.length > 0;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs h-9"
        />
        {filters.map((f) => (
          <Select
            key={f.id}
            value={(table.getColumn(f.id)?.getFilterValue() as string) ?? "all"}
            onValueChange={(v) => table.getColumn(f.id)?.setFilterValue(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setColumnFilters([]); setGlobalFilter(""); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  className="capitalize"
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {allColumns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="text-center text-muted-foreground py-8">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length} record(s)
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <span className="text-xs">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──
export default function ManagePage() {
  const { user } = useAuthStore();
  useEffect(() => {
    if (user && user.role !== "admin") redirect("/");
  }, [user]);

  const { data: volunteers, isLoading: loadingVolunteers } = useVolunteers({});
  const { data: resources, isLoading: loadingResources } = useResources({});
  const { mutate: deleteVolunteer, isPending: deletingVolunteer } = useDeleteVolunteer();
  const { mutate: deleteResource, isPending: deletingResource } = useDeleteResource();

  const [volunteerDialogOpen, setVolunteerDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  const volunteerFilters = [
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Available", value: "available" },
        { label: "On mission", value: "on_mission" },
        { label: "Unavailable", value: "unavailable" },
      ],
    },
    {
      id: "experienceLevel",
      label: "Experience",
      options: [
        { label: "Trainee", value: "trainee" },
        { label: "Junior", value: "junior" },
        { label: "Senior", value: "senior" },
        { label: "Expert", value: "expert" },
      ],
    },
    {
      id: "skills",
      label: "Skill",
      options: ["medic", "driver", "translator", "coordinator", "electrician", "mechanic", "cook", "engineer"].map(
        (s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s })
      ),
    },
  ];

  const resourceFilters = [
    {
      id: "type",
      label: "Type",
      options: ["vehicle", "generator", "drone", "medical_kit"].map(
        (t) => ({ label: t.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase()), value: t })
      ),
    },
    {
      id: "condition",
      label: "Condition",
      options: ["excellent", "good", "needs_maintenance", "inoperable"].map(
        (c) => ({ label: c.replace("_", " ").replace(/^\w/, (ch) => ch.toUpperCase()), value: c })
      ),
    },
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Available", value: "available" },
        { label: "In use", value: "in_use" },
      ],
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage</h1>
        <p className="text-sm text-muted-foreground">
          Admin panel — onboard personnel, register resources, and manage records.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="volunteers">
        <TabsList>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* ── VOLUNTEERS TAB ── */}
        <TabsContent value="volunteers" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Volunteers</h2>
            <Dialog open={volunteerDialogOpen} onOpenChange={setVolunteerDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Onboard Volunteer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Onboard a New Volunteer</DialogTitle>
                </DialogHeader>
                <CreateVolunteerForm />
              </DialogContent>
            </Dialog>
          </div>

          <DataTable<Volunteer>
            columns={volunteerColumns}
            data={volunteers ?? []}
            isLoading={loadingVolunteers}
            onDelete={(v) => deleteVolunteer(v.id)}
            isDeleting={deletingVolunteer}
            filters={volunteerFilters}
            searchPlaceholder="Search volunteers..."
          />
        </TabsContent>

        {/* ── RESOURCES TAB ── */}
        <TabsContent value="resources" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Resources</h2>
            <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Share a Resource</DialogTitle>
                </DialogHeader>
                <CreateResourceForm />
              </DialogContent>
            </Dialog>
          </div>

          <DataTable<Resource>
            columns={resourceColumns}
            data={resources ?? []}
            isLoading={loadingResources}
            onDelete={(r) => deleteResource(r.id)}
            isDeleting={deletingResource}
            filters={resourceFilters}
            searchPlaceholder="Search resources..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

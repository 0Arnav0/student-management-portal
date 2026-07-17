import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api.js";
import { Student, PagedResult, StudentMeta, ApiError } from "@student-portal/shared";
import { toast } from "sonner";
import { Search, Plus, Trash2, Edit3, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { StudentForm } from "../components/StudentForm.js";

export function StudentsPage() {
  const queryClient = useQueryClient();
  
  // Table Query parameters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog controllers
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch dropdown metadata (courses, genders, years, photoUploadEnabled)
  const { data: meta } = useQuery<StudentMeta>({
    queryKey: ["meta"],
    queryFn: () => apiRequest<StudentMeta>("/api/meta"),
  });

  // Fetch paginated student data
  const { data: pageResult, isLoading } = useQuery<PagedResult<Student>>({
    queryKey: ["students", page, debouncedSearch, course, year, gender, sortField, sortOrder],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "10");
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (course) params.append("course", course);
      if (year) params.append("year", year);
      if (gender) params.append("gender", gender);
      params.append("sortField", sortField);
      params.append("sortOrder", sortOrder);
      
      return apiRequest<PagedResult<Student>>(`/api/students?${params.toString()}`);
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<void>(`/api/students/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Student deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // If the last item on the page is deleted, slide back one page
      if (pageResult?.data.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (err: any) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Failed to delete student");
    },
  });

  function handleDelete(student: Student) {
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      deleteMutation.mutate(student.id);
    }
  }

  function handleEdit(student: Student) {
    setSelectedStudent(student);
    setFormOpen(true);
  }

  function handleCreate() {
    setSelectedStudent(null);
    setFormOpen(true);
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }

  function clearFilters() {
    setSearch("");
    setCourse("");
    setYear("");
    setGender("");
    setPage(1);
  }

  const hasActiveFilters = search || course || year || gender;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Students Registry</h2>
          <p className="text-sm text-neutral-400">Manage student files, courses, and admissions</p>
        </div>
        
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="rounded-xl border border-neutral-900 bg-neutral-900/20 p-4">
        <div className="grid gap-4 md:grid-cols-12">
          {/* Search bar */}
          <div className="relative md:col-span-4">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name, email or admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-9 pr-4 py-1.8 text-sm text-white placeholder-neutral-600 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Course filter */}
          <div className="md:col-span-3">
            <select
              value={course}
              onChange={(e) => { setCourse(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.8 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Courses</option>
              {meta?.courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Year filter */}
          <div className="md:col-span-2">
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.8 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Years</option>
              {meta?.years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          {/* Gender filter */}
          <div className="md:col-span-2">
            <select
              value={gender}
              onChange={(e) => { setGender(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.8 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Genders</option>
              {meta?.genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          <div className="md:col-span-1 flex items-center justify-end">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="flex h-9 w-full items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-neutral-900/10">
        <table className="w-full border-collapse text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/60 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-900">
            <tr>
              <th className="px-6 py-4">Photo</th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort("admissionNumber")}>
                <div className="flex items-center gap-1">
                  Admission No <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">
                  Name <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort("course")}>
                <div className="flex items-center gap-1">
                  Course <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort("year")}>
                <div className="flex items-center gap-1">
                  Year <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-4">Contacts</th>
              <th className="px-6 py-4">Gender</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-500" />
                  <p className="mt-2 text-xs text-neutral-500">Retrieving students files...</p>
                </td>
              </tr>
            ) : pageResult?.data && pageResult.data.length > 0 ? (
              pageResult.data.map((student) => {
                const initials = student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={student.id} className="hover:bg-neutral-900/20 transition-colors">
                    <td className="px-6 py-4">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.name}
                          className="h-10 w-10 rounded-full object-cover border border-neutral-800"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-400 border border-neutral-700">
                          {initials}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs tracking-wider text-teal-400">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                    <td className="px-6 py-4 text-xs">{student.course}</td>
                    <td className="px-6 py-4 text-xs">Year {student.year}</td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-neutral-300">{student.email}</div>
                      <div className="text-neutral-500">{student.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-medium ${
                        student.gender === "MALE" 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                          : student.gender === "FEMALE"
                          ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                          : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit student profile"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded bg-red-950/10 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete student file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-20 text-center text-neutral-500">
                  <div className="mx-auto mb-2 text-neutral-600 text-3xl">📭</div>
                  <p className="text-sm">No student records found.</p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-3 text-xs text-teal-400 hover:underline cursor-pointer"
                    >
                      Clear filters and search again
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pageResult && pageResult.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-900 pt-4">
          <div className="text-xs text-neutral-500">
            Showing Page {pageResult.page} of {pageResult.totalPages} ({pageResult.total} total students)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pageResult.totalPages, page + 1))}
              disabled={page === pageResult.totalPages}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Student Form Dialog */}
      {formOpen && (
        <StudentForm
          visible={formOpen}
          onClose={() => setFormOpen(false)}
          student={selectedStudent}
          meta={meta}
        />
      )}
    </div>
  );
}

// Inline Loader component helper
function Loader2({ className }: { className?: string }) {
  return <Loader2Icon className={className} />;
}
import { Loader2 as Loader2Icon } from "lucide-react";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api.js";
import { Student, PagedResult, StudentMeta, ApiError, StudentStats } from "@student-portal/shared";
import { toast } from "sonner";
import { Search, Plus, Trash2, Edit3, X, SlidersHorizontal, ArrowUpDown, Users, BookOpen, Calendar, BarChart3 } from "lucide-react";
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
  const [activeStatsModal, setActiveStatsModal] = useState<"total" | "courses" | "year" | "gender" | null>(null);

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

  // Fetch database analytics/statistics
  const { data: stats } = useQuery<StudentStats>({
    queryKey: ["stats"],
    queryFn: () => apiRequest<StudentStats>("/api/students/stats"),
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
      queryClient.invalidateQueries({ queryKey: ["stats"] });
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

      {/* Analytics Summary Cards (Dynamic Database Stats) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Enrolled</p>
            <h4 className="text-2xl font-bold text-white mt-1.5">{stats?.total ?? 0}</h4>
            <p className="text-xxs text-neutral-400 mt-0.5">Active Student Files</p>
          </div>
          <div className="rounded-lg bg-teal-500/10 p-3 text-teal-400 border border-teal-500/20">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Courses Offered */}
        <div
          onClick={() => setActiveStatsModal("courses")}
          className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-5 flex items-center justify-between shadow-sm cursor-pointer hover:border-purple-500/30 hover:bg-neutral-900/50 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Active Courses</p>
            <h4 className="text-2xl font-bold text-white mt-1.5">{stats?.courses?.length ?? 0}</h4>
            <p className="text-xxs text-neutral-400 mt-0.5">Unique Programs</p>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400 border border-purple-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Year Distribution */}
        <div
          onClick={() => setActiveStatsModal("year")}
          className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-5 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-500/30 hover:bg-neutral-900/50 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Year Breakdown</p>
            <div className="flex gap-2.5 mt-2.5">
              {[1, 2, 3, 4].map((yr) => {
                const count = stats?.year?.find((y) => y.year === yr)?.count ?? 0;
                return (
                  <div key={yr} className="text-center">
                    <div className="text-xxs text-neutral-500">Yr {yr}</div>
                    <div className="text-xs font-bold text-white mt-0.5">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400 border border-blue-500/20">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Gender Breakdown */}
        <div
          onClick={() => setActiveStatsModal("gender")}
          className="rounded-xl border border-neutral-900 bg-neutral-900/30 p-5 flex items-center justify-between shadow-sm cursor-pointer hover:border-pink-500/30 hover:bg-neutral-900/50 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Gender Ratio</p>
            <div className="flex gap-4 mt-2.5">
              {["MALE", "FEMALE", "OTHER"].map((g) => {
                const count = stats?.gender?.find((x) => x.gender === g)?.count ?? 0;
                return (
                  <div key={g} className="text-center">
                    <div className="text-xxs text-neutral-500">{g === "MALE" ? "Men" : g === "FEMALE" ? "Women" : "Other"}</div>
                    <div className="text-xs font-bold text-white mt-0.5">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg bg-pink-500/10 p-3 text-pink-400 border border-pink-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
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

      {/* Dynamic Detailed Analytics Popups */}
      {activeStatsModal && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h3 className="text-md font-semibold text-white">
                {activeStatsModal === "total" && "Total Enrollment Statistics"}
                {activeStatsModal === "courses" && "Course Distribution Analytics"}
                {activeStatsModal === "year" && "Academic Year Demographics"}
                {activeStatsModal === "gender" && "Gender Diversity Ratios"}
              </h3>
              <button
                onClick={() => setActiveStatsModal(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Charts */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* COURSES CHARTS PANEL */}
              {activeStatsModal === "courses" && (
                <div className="space-y-5">
                  <p className="text-xs text-neutral-400 leading-normal">
                    This chart shows the distribution of enrolled students across different academic programs:
                  </p>
                  {stats.courses && stats.courses.length > 0 ? (
                    stats.courses
                      .sort((a, b) => b.count - a.count) // Sort by popularity
                      .map((c) => {
                        const pct = stats.total > 0 ? ((c.count / stats.total) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={c.course} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-neutral-200 font-medium">{c.course}</span>
                              <span className="text-purple-400 font-semibold">{c.count} students ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-neutral-950 border border-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm text-neutral-500 text-center py-6">No program enrollments found.</p>
                  )}
                </div>
              )}

              {/* YEAR CHARTS PANEL */}
              {activeStatsModal === "year" && (
                <div className="space-y-5">
                  <p className="text-xs text-neutral-400 leading-normal">
                    Breakdown of enrolled student populations by academic year:
                  </p>
                  {[1, 2, 3, 4].map((yr) => {
                    const count = stats.year?.find((y) => y.year === yr)?.count ?? 0;
                    const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0.0";
                    const labels = ["Freshman", "Sophomore", "Junior", "Senior"];
                    return (
                      <div key={yr} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-200 font-medium">Year {yr} ({labels[yr - 1]})</span>
                          <span className="text-blue-400 font-semibold">{count} students ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-950 border border-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* GENDER CHARTS PANEL */}
              {activeStatsModal === "gender" && (
                <div className="space-y-5">
                  <p className="text-xs text-neutral-400 leading-normal">
                    Diversity metrics showing the gender ratio inside the current registry:
                  </p>
                  {["MALE", "FEMALE", "OTHER"].map((g) => {
                    const count = stats.gender?.find((x) => x.gender === g)?.count ?? 0;
                    const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0.0";
                    const label = g === "MALE" ? "Men (MALE)" : g === "FEMALE" ? "Women (FEMALE)" : "Other / Non-Binary";
                    const barColor = g === "MALE" ? "bg-blue-500" : g === "FEMALE" ? "bg-pink-500" : "bg-neutral-500";
                    const textColor = g === "MALE" ? "text-blue-400" : g === "FEMALE" ? "text-pink-400" : "text-neutral-400";
                    return (
                      <div key={g} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-200 font-medium">{label}</span>
                          <span className={`${textColor} font-semibold`}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-950 border border-neutral-800 overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-neutral-800 bg-neutral-950 px-6 py-4">
              <button
                onClick={() => setActiveStatsModal(null)}
                className="rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Loader component helper
function Loader2({ className }: { className?: string }) {
  return <Loader2Icon className={className} />;
}
import { Loader2 as Loader2Icon } from "lucide-react";

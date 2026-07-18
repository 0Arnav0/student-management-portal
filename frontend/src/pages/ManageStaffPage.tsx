import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "../lib/api.js";
import { createUserSchema, CreateUserInput, StaffUser, ApiError, formatZodError } from "@student-portal/shared";
import { useAuth } from "../context/AuthContext.js";
import { toast } from "sonner";
import { Plus, UserPlus, Eye, EyeOff, Loader2, X, Check, XCircle } from "lucide-react";

export function ManageStaffPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Dialog visibility state
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "ADMIN" },
  });

  // Fetch all staff users
  const { data: staffList, isLoading } = useQuery<StaffUser[]>({
    queryKey: ["users"],
    queryFn: () => apiRequest<StaffUser[]>("/api/users"),
  });

  // Add staff mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserInput) =>
      apiRequest<StaffUser>("/api/users", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      toast.success("Staff account created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      reset();
      setServerErrors({});
    },
    onError: (err: any) => {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        setServerErrors(apiErr.errors);
      } else {
        toast.error(apiErr.message || "Failed to create staff account");
      }
    },
  });

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest<StaffUser>(`/api/users/${id}/active`, {
        method: "PATCH",
        json: { isActive },
      }),
    onSuccess: (updatedUser) => {
      toast.success(`${updatedUser.name} is now ${updatedUser.isActive ? "active" : "inactive"}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Failed to toggle account status");
    },
  });

  function onSubmit(data: CreateUserInput) {
    createMutation.mutate(data);
  }

  function handleToggleStatus(staff: StaffUser) {
    const action = staff.isActive ? "deactivate" : "activate";
    if (staff.id === currentUser?.id) {
      toast.error("You cannot change your own status.");
      return;
    }

    // Deactivation confirm gate
    if (action === "deactivate" && !confirm(`Are you sure you want to suspend access for ${staff.name}?`)) {
      return;
    }

    toggleMutation.mutate({ id: staff.id, isActive: !staff.isActive });
  }

  function getErrorMessage(fieldName: string): string | undefined {
    return errors[fieldName as keyof CreateUserInput]?.message || serverErrors[fieldName];
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Staff Management</h2>
          <p className="text-sm text-neutral-400">Principal console: manage administrative access and logs</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Staff list table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-neutral-900/10">
        <table className="w-full border-collapse text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/60 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-900">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-500" />
                  <p className="mt-2 text-xs text-neutral-500">Retrieving staff listings...</p>
                </td>
              </tr>
            ) : staffList && staffList.length > 0 ? (
              staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-neutral-900/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {staff.name} {staff.id === currentUser?.id && <span className="text-teal-500 text-xs italic ml-1.5">(you)</span>}
                  </td>
                  <td className="px-6 py-4">{staff.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-medium ${staff.role === "PRINCIPAL"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {staff.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                        <Check className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                        <XCircle className="h-3.5 w-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-neutral-500">
                    {staff.lastLoginAt
                      ? new Date(staff.lastLoginAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {staff.id !== currentUser?.id ? (
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        className={`inline-flex items-center justify-center rounded px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${staff.isActive
                            ? "bg-red-950/15 border-red-500/20 text-red-400 hover:bg-red-500/10"
                            : "bg-green-950/15 border-green-500/20 text-green-400 hover:bg-green-500/10"
                          }`}
                      >
                        {staff.isActive ? "Suspend Access" : "Activate"}
                      </button>
                    ) : (
                      <span className="text-neutral-600 text-xs italic">No actions available</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-20 text-center text-neutral-500">
                  No staff accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h3 className="text-md font-semibold text-white">Create Staff Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Staff Name</label>
                <input
                  type="text"
                  placeholder="e.g. Admin staff"
                  {...register("name")}
                  className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-700 focus:border-teal-500 focus:outline-none"
                />
                {getErrorMessage("name") && <p className="field-error">{getErrorMessage("name")}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. staff@college.edu"
                  {...register("email")}
                  className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-700 focus:border-teal-500 focus:outline-none"
                />
                {getErrorMessage("email") && <p className="field-error">{getErrorMessage("email")}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Temporary Password</label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    {...register("password")}
                    className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-3 pr-10 py-2 text-sm text-white placeholder-neutral-700 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {getErrorMessage("password") && <p className="field-error">{getErrorMessage("password")}</p>}
              </div>

              {/* Role select */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">System Role</label>
                <select
                  {...register("role")}
                  className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (CRUD access to Student Registry)</option>
                  <option value="PRINCIPAL">PRINCIPAL (Full access + manage staff)</option>
                </select>
                {getErrorMessage("role") && <p className="field-error">{getErrorMessage("role")}</p>}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-neutral-800 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ManageStaffPage;

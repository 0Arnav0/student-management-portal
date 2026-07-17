import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api.js";
import {
  studentSchema,
  studentUpdateSchema,
  StudentInput,
  StudentUpdateInput,
  Student,
  StudentMeta,
  ApiError,
} from "@student-portal/shared";
import { toast } from "sonner";
import { X, Upload, Trash, Loader2 } from "lucide-react";

interface StudentFormProps {
  visible: boolean;
  onClose: () => void;
  student: Student | null;
  meta?: StudentMeta;
}

export function StudentForm({ onClose, student, meta }: StudentFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEdit = Boolean(student);
  
  // Local state for photo upload preview
  const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Local state for backend API validation errors (422)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const schema = isEdit ? studentUpdateSchema : studentSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: student
      ? {
          name: student.name,
          email: student.email,
          course: student.course,
          year: String(student.year),
          dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
          mobile: student.mobile,
          gender: student.gender,
          address: student.address,
        }
      : {
          name: "",
          email: "",
          course: "",
          year: "",
          dob: "",
          mobile: "",
          gender: "",
          address: "",
        },
  });

  // Watch fields and clear matching server errors when modified
  const watchedFields = watch();
  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name && serverErrors[name]) {
        setServerErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, serverErrors]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (isEdit && student) {
        return apiRequest<Student>(`/api/students/${student.id}`, {
          method: "PUT",
          body: formData, // Standard fetch automatically maps boundary headers for FormData
        });
      } else {
        return apiRequest<Student>("/api/students", {
          method: "POST",
          body: formData,
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Student file updated successfully" : "Student enrolled successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err: any) => {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        // Map 422 field-level validations
        setServerErrors(apiErr.errors);
        toast.error("Validation failed. Please correct the fields.");
      } else {
        toast.error(apiErr.message || "Failed to save student profile");
      }
    },
  });

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePhotoRemove() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onSubmit(data: any) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    });

    if (photoFile) {
      formData.append("photo", photoFile);
    } else if (!photoPreview && student?.photoUrl) {
      // In case we want to delete photo, we pass empty string as flag
      formData.append("photoPublicId", ""); 
    }

    mutation.mutate(formData);
  }

  // Get validation messages from either Zod client error or Server response
  function getErrorMessage(fieldName: string): string | undefined {
    return errors[fieldName]?.message as string | undefined || serverErrors[fieldName];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">
            {isEdit ? `Edit Student: ${student?.name}` : "Enroll New Student"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
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
                placeholder="e.g. aarav.sharma@example.com"
                {...register("email")}
                className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-700 focus:border-teal-500 focus:outline-none"
              />
              {getErrorMessage("email") && <p className="field-error">{getErrorMessage("email")}</p>}
            </div>

            {/* Course */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Course Program</label>
              <select
                {...register("course")}
                className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select a Course</option>
                {meta?.courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {getErrorMessage("course") && <p className="field-error">{getErrorMessage("course")}</p>}
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Academic Year</label>
              <select
                {...register("year")}
                className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select Year</option>
                {meta?.years.map((y) => (
                  <option key={y} value={y}>
                    {y === 1 ? "1st Year (Freshman)" : y === 2 ? "2nd Year (Sophomore)" : y === 3 ? "3rd Year (Junior)" : "4th Year (Senior)"}
                  </option>
                ))}
              </select>
              {getErrorMessage("year") && <p className="field-error">{getErrorMessage("year")}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Date of Birth</label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]} // DOB must be in past
                {...register("dob")}
                className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
              />
              {getErrorMessage("dob") && <p className="field-error">{getErrorMessage("dob")}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Gender</label>
              <select
                {...register("gender")}
                className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select Gender</option>
                {meta?.genders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {getErrorMessage("gender") && <p className="field-error">{getErrorMessage("gender")}</p>}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Mobile Number</label>
              <input
                type="text"
                placeholder="10-digit number"
                maxLength={10}
                {...register("mobile")}
                className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-700 focus:border-teal-500 focus:outline-none"
              />
              {getErrorMessage("mobile") && <p className="field-error">{getErrorMessage("mobile")}</p>}
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Profile Photo</label>
              
              {meta?.photoUploadEnabled ? (
                <div className="mt-2 flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-14 w-14 rounded-lg object-cover border border-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={handlePhotoRemove}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800 hover:border-teal-500 text-neutral-500 hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  
                  <div className="text-xxs text-neutral-500 leading-normal">
                    <p className="text-neutral-400">JPG, PNG, WEBP, or GIF</p>
                    <p>Max size: 5 MB</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-neutral-500 leading-normal italic">
                  Photo uploads are disabled. Set CLOUDINARY_URL in backend configuration to activate.
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Residential Address</label>
            <textarea
              placeholder="Full postal address..."
              rows={3}
              {...register("address")}
              className="mt-2 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-700 focus:border-teal-500 focus:outline-none resize-none"
            />
            {getErrorMessage("address") && <p className="field-error">{getErrorMessage("address")}</p>}
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving profile...
                </>
              ) : (
                isEdit ? "Update File" : "Enroll Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

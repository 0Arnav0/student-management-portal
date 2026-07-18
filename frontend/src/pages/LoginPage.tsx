import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput, ApiError } from "@student-portal/shared";
import { useAuth } from "../context/AuthContext.js";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    try {
      setErrorMsg(null);
      await login(data);
      navigate("/");
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr.message || "Invalid email or password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-neutral-900 to-neutral-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Staff Sign In</h2>
          <p className="mt-1.5 text-sm text-neutral-400">Student Management System</p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">Email Address</label>
            <input
              type="email"
              placeholder="e.g. admin@college.edu"
              {...register("email")}
              className="mt-1.5 block w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-teal-500 focus:outline-none"
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-3 pr-10 py-2 text-sm text-white placeholder-neutral-600 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
export default LoginPage;

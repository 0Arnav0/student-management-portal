import { Link, Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import { GraduationCap, LogOut, Users, FileText } from "lucide-react";

export function Layout() {
  const { user, logout, isPrincipal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-50">
      {/* Header / Navbar */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-teal-500" />
            <div>
              <h1 className="text-md font-semibold tracking-tight text-white leading-tight">Student Portal</h1>
              <span className="text-xs text-neutral-400">Pillai University</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-teal-400 ${
                isActive("/") ? "text-teal-400" : "text-neutral-300"
              }`}
            >
              Students
            </Link>
            
            {isPrincipal && (
              <Link
                to="/users"
                className={`text-sm font-medium transition-colors hover:text-teal-400 ${
                  isActive("/users") ? "text-teal-400" : "text-neutral-300"
                }`}
              >
                Manage Staff
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 border-l border-neutral-800 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-medium ${
                    user.role === "PRINCIPAL" 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} Pillai University. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
export default Layout;

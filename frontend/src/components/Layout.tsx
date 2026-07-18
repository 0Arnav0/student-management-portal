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
    <div className="flex min-h-screen bg-neutral-950 text-neutral-50">
      {/* Retractable Left Sidebar (Hover-Expanding) */}
      <aside className="group fixed inset-y-0 left-0 z-50 flex w-16 hover:w-64 flex-col border-r border-neutral-800 bg-neutral-900 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden">
        {/* Brand Logo & Title */}
        <div className="flex h-16 items-center px-4 gap-3 border-b border-neutral-800 overflow-hidden shrink-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="text-sm font-bold text-white leading-none">Student Portal</h1>
            <span className="text-xxs text-neutral-500 mt-0.5 block">Pillai University</span>
          </div>
        </div>

        {/* Navigation Registry Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-hidden mt-4">
          <Link
            to="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border ${
              isActive("/") 
                ? "bg-teal-500/10 text-teal-400 border-teal-500/20" 
                : "text-neutral-400 hover:bg-neutral-800/40 hover:text-white border-transparent"
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Students Registry
            </span>
          </Link>
          
          {isPrincipal && (
            <Link
              to="/users"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border ${
                isActive("/users") 
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                  : "text-neutral-400 hover:bg-neutral-800/40 hover:text-white border-transparent"
              }`}
            >
              <FileText className="h-5 w-5 shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Manage Staff
              </span>
            </Link>
          )}
        </nav>

        {/* Logout Control at Bottom */}
        {user && (
          <div className="border-t border-neutral-800 p-3 overflow-hidden shrink-0">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border border-transparent"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Sign Out
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Primary Page Layout Panel */}
      <div className="flex flex-1 flex-col pl-16">
        {/* Top bar Profile Display */}
        <header className="flex h-16 items-center justify-end border-b border-neutral-800 bg-neutral-900/20 px-8 backdrop-blur-md sticky top-0 z-40 shrink-0">
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-medium ${
                  user.role === "PRINCIPAL" 
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                    : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Dynamic page container */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500 shrink-0">
          &copy; {new Date().getFullYear()} Pillai University. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
export default Layout;

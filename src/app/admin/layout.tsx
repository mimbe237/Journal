import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const allowedRoles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.FACTURATION,
    UserRole.SUPPORT,
    UserRole.COMPTE_ENTREPRISE // Some admin pages might be shared or we need to be careful
  ];

  // Note: COMPTE_ENTREPRISE has limited access, usually handled by page-level checks or middleware.
  // But for the general "Admin" layout, we might want to allow them if they have access to /admin routes.
  // However, typically Enterprise Admin has a separate layout or dashboard.
  // If they share this layout, we must ensure they don't see what they shouldn't.
  // Based on permissions.ts, COMPTE_ENTREPRISE has access to "/admin" (maybe for legacy reasons or shared components).
  // Let's allow them here but individual pages must protect themselves.
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard"); // Redirect unauthorized users to their dashboard
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

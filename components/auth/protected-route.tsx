import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  redirectTo = "/auth/signin",
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
      } else if (requireAdmin && !isAdmin) {
        // Si requiere admin pero no es admin, redirigir a la página principal
        router.push("/");
      }
    }
  }, [user, isAdmin, loading, router, redirectTo, requireAdmin]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay usuario autenticado, no mostrar nada (la redirección ya se activó)
  if (!user) {
    return null;
  }

  // Si requiere admin pero no es admin, no mostrar nada (la redirección ya se activó)
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  // Si hay usuario autenticado y cumple los requisitos, mostrar el contenido protegido
  return <>{children}</>;
}

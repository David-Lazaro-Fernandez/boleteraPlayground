"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";

interface HeaderProps {
  activePage: string;
}

export function Header({ activePage }: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Obtener iniciales del usuario para el avatar
  const getUserInitials = (email: string | null) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  // Obtener nombre del usuario (por ahora del email)
  const getUserDisplayName = (email: string | null) => {
    if (!email) return "Usuario";
    return email.split("@")[0];
  };

  const navItems = [
    { name: "Inicio", href: "/dashboard", key: "dashboard" },
    { name: "Eventos", href: "/dashboard/eventos", key: "eventos" },
    {
      name: "Mapas De Asientos",
      href: "/dashboard/mapas-asientos",
      key: "mapas-asientos",
    },
    {
      name: "Boletos Pruebas",
      href: "/dashboard/prueba-boleto",
      key: "boletos-pruebas",
    },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="flex h-16 items-center px-6">
        {/* User Dropdown Menu */}
        <div className="mr-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getUserInitials(user?.email || null)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900">
                  {getUserDisplayName(user?.email || null)}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center space-x-6 flex-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                activePage === item.key
                  ? "text-blue-600 font-medium border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              } pb-4 whitespace-nowrap`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Search and Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar" className="pl-10 w-64" />
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getUserInitials(user?.email || null)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

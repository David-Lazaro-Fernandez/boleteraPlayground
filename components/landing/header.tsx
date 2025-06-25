import { Button } from "@/components/ui/button";
import { Logo } from "@/components/prueba-boleto/logo";
export function Header() {
  const navItems = [
    { name: "Eventos", href: "#" },
    { name: "Conciertos", href: "#" },
    { name: "Bailes", href: "#" },
    { name: "Contacto", href: "#" },
  ];

  return (
    <header className="bg-gradient-to-r from-gradient-start to-gradient-end text-navbar-text">
      <div className="container mx-auto px-6 lg:px-8 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo className="w-24 fill-white" />
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <NavItem key={item.name} name={item.name} href={item.href} />
            ))}
            <Button
              variant="outline"
              className="bg-transparent text-navbar-text border-navbar-text hover:bg-navbar-text hover:text-gradient-start"
            >
              Login
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavItem({ name, href }: { name: string; href: string }) {
  return (
    <a href={href} className="hover:text-navbar-text/80 transition-colors">
      {name}
    </a>
  );
}

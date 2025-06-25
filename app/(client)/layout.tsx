import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

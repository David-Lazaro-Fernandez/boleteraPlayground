"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/dashboardLayout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const activePage = pathname.split("/").pop() || "";
    console.log(activePage);
    return (
        <ProtectedRoute redirectTo="/auth/signin" requireAdmin={true}>
            <MainLayout activePage={activePage}>{children}</MainLayout>
        </ProtectedRoute>
    );
}

"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/dashboardLayout/main-layout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const activePage = pathname.split("/").pop() || "";
    console.log(activePage);
    return (
        <MainLayout activePage={activePage}>{children}</MainLayout>
    );
}

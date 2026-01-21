import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardClient session={session}>
      {children}
    </DashboardClient>
  );
}

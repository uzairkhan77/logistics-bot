import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Quote desk",
  description: "Enquiries captured by the quote agent, and which lanes it answers itself.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}

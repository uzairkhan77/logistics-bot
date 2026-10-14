import type { Metadata } from "next";
import { AutomationView } from "@/components/admin/AutomationView";

export const metadata: Metadata = {
  title: "Automation",
  description: "Choose which routes the assistant prices on its own.",
};

export default function AutomationPage() {
  return <AutomationView />;
}

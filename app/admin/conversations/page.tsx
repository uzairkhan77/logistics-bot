import type { Metadata } from "next";
import { ConversationsView } from "@/components/admin/ConversationsView";

export const metadata: Metadata = {
  title: "Conversations",
  description: "Every chat the quote agent had, word for word.",
};

export default function ConversationsPage() {
  return <ConversationsView />;
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { QrPrintPanel } from "@/components/QrPrintPanel";

export default async function AdminQrPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <QrPrintPanel />;
}

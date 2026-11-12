import { notFound } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import PractitionerForm from "@/components/PractitionerForm";
import { requireAdminPage } from "@/lib/require-admin";
import { listPractitioners, uploadMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditPractitioner({ params }) {
  await requireAdminPage();
  const { id } = await params;
  const record = (await listPractitioners()).find((p) => p.id === id);
  if (!record) notFound();
  return (
    <>
      <AdminHeader />
      <PractitionerForm initial={record} uploads={uploadMode()} />
    </>
  );
}

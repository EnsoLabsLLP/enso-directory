import AdminHeader from "@/components/AdminHeader";
import PractitionerForm from "@/components/PractitionerForm";
import { requireAdminPage } from "@/lib/require-admin";
import { uploadMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewPractitioner() {
  await requireAdminPage();
  return (
    <>
      <AdminHeader />
      <PractitionerForm initial={null} uploads={uploadMode()} />
    </>
  );
}

import AdminHeader from "@/components/AdminHeader";
import AdminDashboard from "@/components/AdminDashboard";
import { requireAdminPage } from "@/lib/require-admin";
import { listPractitioners, listRequests, status, storageMode, uploadMode, sheetUrl } from "@/lib/store";
import { sortRecords } from "@/lib/practitioners";

export const dynamic = "force-dynamic";

function describe(e) {
  if (e && e.status === 403) return "The app can't open your Google Sheet. Share the sheet with the service account email as an Editor.";
  if (e && e.status === 404) return "The Google Sheet wasn't found. Check GOOGLE_SHEET_ID in Vercel.";
  return "Couldn't reach the Google Sheet. Check the Google settings in Vercel, then reload.";
}

export default async function AdminHome() {
  await requireAdminPage();
  let practitioners = [], requests = [], ready = false, error = null;
  try {
    ready = (await status()).ready;
    if (ready) [practitioners, requests] = await Promise.all([listPractitioners(), listRequests(30)]);
  } catch (e) {
    console.error(e);
    error = describe(e);
  }
  return (
    <>
      <AdminHeader />
      <AdminDashboard
        initial={{
          practitioners: sortRecords(practitioners),
          requests,
          ready,
          error,
          storage: storageMode(),
          uploads: uploadMode(),
          sheetUrl: sheetUrl()
        }}
      />
    </>
  );
}

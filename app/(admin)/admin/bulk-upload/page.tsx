import { BulkUploadClient } from "@/components/admin/bulk-upload-client";

export const metadata = {
  title: "Bulk Upload Products",
};

export default function BulkUploadPage() {
  return (
    <div className="animate-page-enter">
      <BulkUploadClient />
    </div>
  );
}

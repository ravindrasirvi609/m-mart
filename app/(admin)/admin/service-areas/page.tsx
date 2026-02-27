import { getAdminServiceAreas } from "@/lib/queries";
import { ServiceAreasClient } from "@/components/admin/service-areas-client";

export const metadata = { title: "Admin Service Areas" };

export default async function AdminServiceAreasPage() {
  const serviceAreas = await getAdminServiceAreas();

  return (
    <div className="animate-page-enter">
      <ServiceAreasClient serviceAreas={serviceAreas} />
    </div>
  );
}

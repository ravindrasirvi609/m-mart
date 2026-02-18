import { getAdminUsersData } from "@/lib/queries";
import { UsersClient } from "@/components/admin/users-client";

export const metadata = {
    title: "Admin Users",
};

export default async function AdminUsersPage() {
    const users = await getAdminUsersData();

    return (
        <div className="animate-page-enter">
            <UsersClient users={users} />
        </div>
    );
}

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error(".env file not found");
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, "utf-8");

  const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim().replace(/^["'](.*)["']$/, '$1') : undefined;
  };

  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = getEnv("ADMIN_EMAIL");

  if (!url || !serviceKey || !adminEmail) {
    console.error("Missing environment variables in .env");
    console.log("Checking for:", { url: !!url, serviceKey: !!serviceKey, adminEmail: !!adminEmail });
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log(`Setting up admin user role for: ${adminEmail}`);

  // 1. Ensure user is in public.admin_users
  const { error: dbError } = await supabase
    .from("admin_users")
    .upsert({ email: adminEmail }, { onConflict: "email" });

  if (dbError) {
    console.error("Error adding to admin_users table:", dbError.message);
    process.exit(1);
  }

  console.log("Successfully added to admin_users table.");
  console.log(`Admin login is available via OTP at /login using email: ${adminEmail}`);
}

main().catch(console.error);

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const emailArg = process.argv[2];

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
  const defaultAdminEmail = getEnv("ADMIN_EMAIL");

  const adminEmail = emailArg || defaultAdminEmail;

  if (!url || !serviceKey || !adminEmail) {
    console.error("Missing required configuration.");
    if (!adminEmail) {
      console.log("Error: No email provided. Pass it as an argument or set ADMIN_EMAIL in .env");
    }
    console.log("Configuration status:", {
      supabaseUrl: !!url,
      serviceRoleKey: !!serviceKey,
      email: adminEmail,
    });
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log(`Setting up admin user role for: ${adminEmail}`);

  const normalizedEmail = adminEmail.toLowerCase().trim();

  // 1. Ensure user is in public.admin_users
  const { error: dbError } = await supabase
    .from("admin_users")
    .upsert({ email: normalizedEmail }, { onConflict: "email" });

  if (dbError) {
    console.error("Error adding to admin_users table:", dbError.message);
    process.exit(1);
  }

  console.log("Successfully added to admin_users table.");
  console.log(`Admin login is available via OTP at /login using email: ${normalizedEmail}`);
}

main().catch(console.error);


import { storage } from "../server/storage";

async function makeSuperAdmin() {
  const adminName = "Md Kashif";
  
  console.log(`Searching for admin: ${adminName}...`);
  const admin = await storage.getAdminByName(adminName);
  
  if (!admin) {
    console.error(`Admin '${adminName}' not found!`);
    process.exit(1);
  }

  console.log(`Found admin: ${admin.name} (Current Role: ${admin.role})`);
  
  if (admin.role === 'super_admin') {
    console.log("User is already a Super Admin.");
    process.exit(0);
  }

  console.log("Updating role to 'super_admin'...");
  const updatedAdmin = await storage.updateAdmin(admin.id, { role: 'super_admin' });
  
  if (updatedAdmin) {
    console.log(`Success! ${updatedAdmin.name} is now a ${updatedAdmin.role}.`);
    console.log("You can now access the hidden panel at: /Knsgp2023-admin");
  } else {
    console.error("Failed to update admin.");
    process.exit(1);
  }
  
  process.exit(0);
}

makeSuperAdmin().catch(console.error);

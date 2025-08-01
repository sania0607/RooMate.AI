import bcrypt from "bcryptjs";
import { storage } from "../storage.ts";
import { db } from "../db.ts";
import { admins } from "../../shared/schema.ts";

async function createDefaultAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (existingAdmin) {
      console.log("Default admin already exists");
      return;
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.insert(admins).values({
      username: "admin",
      password: hashedPassword,
      name: "System Administrator",
      email: "admin@roommate.ai",
      role: "super_admin",
      isActive: true,
    });

    console.log("Default admin created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Please change the default password after first login");
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
}

// Run if this file is executed directly
createDefaultAdmin().then(() => process.exit(0));
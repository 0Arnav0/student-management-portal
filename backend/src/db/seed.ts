import "dotenv/config";
import { db, client } from "./db.js";
import { students, activityLogs } from "./schema.js";
import { nextAdmissionNumber } from "../services/admissionNumber.js";
import { count } from "drizzle-orm";

const SAMPLE = [
  { name: "Aarav Sharma", course: "B.Sc Computer Science", year: 2, dob: "2004-05-14", email: "aarav.sharma@example.com", mobile: "9876543210", gender: "MALE" as const, address: "12 MG Road, Panvel" },
  { name: "Diya Patel", course: "BCA", year: 1, dob: "2005-11-02", email: "diya.patel@example.com", mobile: "9823456781", gender: "FEMALE" as const, address: "45 Hill View, Navi Mumbai" },
  { name: "Rohan Mehta", course: "B.Com", year: 3, dob: "2003-01-27", email: "rohan.mehta@example.com", mobile: "9812345678", gender: "MALE" as const, address: "8 Sector 15, Kharghar" },
  { name: "Ananya Iyer", course: "B.Sc Information Technology", year: 2, dob: "2004-08-19", email: "ananya.iyer@example.com", mobile: "9834567812", gender: "FEMALE" as const, address: "23 Palm Beach Rd, Vashi" },
  { name: "Kabir Nair", course: "B.E Mechanical", year: 4, dob: "2002-03-09", email: "kabir.nair@example.com", mobile: "9845678123", gender: "MALE" as const, address: "77 Station Rd, Belapur" },
];

async function main() {
  const [result] = await db.select({ value: count() }).from(students);
  const studentCount = result?.value || 0;

  if (studentCount > 0) {
    console.log(`Skipping seed: ${studentCount} students already exist.`);
    return;
  }

  for (const record of SAMPLE) {
    await db.transaction(async (tx) => {
      const admissionNumber = await nextAdmissionNumber(tx);
      
      const [created] = await tx.insert(students).values({
        ...record,
        dob: record.dob, // date in schema.ts is a string type for date values
        admissionNumber,
      }).returning();

      await tx.insert(activityLogs).values({
        entityType: "Student",
        action: "CREATE",
        entityId: created.id,
        details: JSON.stringify({ admissionNumber, name: created.name, source: "seed" }),
      });
    });
  }
  
  console.log(`Seeded ${SAMPLE.length} students.`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });

import { db } from "../db/db.js";
import { sql } from "drizzle-orm";

export async function nextAdmissionNumber(tx?: any): Promise<string> {
  const year = new Date().getFullYear();
  const executor = tx || db;
  
  // Drizzle raw query execution
  const result = await executor.execute(sql`SELECT nextval('student_admission_seq') as val`);
  
  if (!result || result.length === 0) {
    throw new Error("Failed to retrieve next value from student_admission_seq");
  }
  
  const val = result[0]?.val;
  const num = String(val).padStart(4, "0");
  return `PU-${year}-${num}`;
}

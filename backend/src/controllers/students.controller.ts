import { Request, Response } from "express";
import { db } from "../db/db.js";
import { students, activityLogs } from "../db/schema.js";
import { eq, and, or, ilike, desc, asc, count, SQL } from "drizzle-orm";
import { uploadPhoto, deletePhoto } from "../lib/cloudinary.js";
import { nextAdmissionNumber } from "../services/admissionNumber.js";
import { logActivity } from "../services/activityLog.js";
import { studentSchema, studentUpdateSchema, formatZodError } from "@student-portal/shared";
import { HttpError } from "../middleware/errorHandler.js";

const SORTABLE_FIELDS = new Set([
  "name",
  "admissionNumber",
  "course",
  "year",
  "email",
  "createdAt",
]);

function buildListQuery(query: any) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  const conditions: SQL[] = [];

  if (query.search) {
    const search = `%${String(query.search).trim()}%`;
    conditions.push(
      or(
        ilike(students.name, search),
        ilike(students.email, search),
        ilike(students.admissionNumber, search)
      ) as SQL
    );
  }

  if (query.course) {
    conditions.push(eq(students.course, String(query.course)));
  }

  if (query.gender) {
    conditions.push(eq(students.gender, String(query.gender) as any));
  }

  if (query.year) {
    const year = Number.parseInt(query.year, 10);
    if (!Number.isNaN(year)) {
      conditions.push(eq(students.year, year));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortField = SORTABLE_FIELDS.has(query.sortField) ? query.sortField : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  // Map schema field names to Drizzle columns
  let orderByColumn;
  if (sortField === "name") orderByColumn = students.name;
  else if (sortField === "admissionNumber") orderByColumn = students.admissionNumber;
  else if (sortField === "course") orderByColumn = students.course;
  else if (sortField === "year") orderByColumn = students.year;
  else if (sortField === "email") orderByColumn = students.email;
  else orderByColumn = students.createdAt;

  const orderByClause = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn);

  return { page, limit, whereClause, orderByClause };
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  const { page, limit, whereClause, orderByClause } = buildListQuery(req.query);

  const [data, [countResult]] = await Promise.all([
    db
      .select()
      .from(students)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ value: count() })
      .from(students)
      .where(whereClause),
  ]);

  const total = countResult?.value || 0;

  res.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    throw new HttpError(400, "Invalid student ID");
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  if (!student) throw new HttpError(404, "Student not found");
  res.json(student);
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(422, "Validation failed", formatZodError(parsed.error));
  }

  let photo: { url: string; publicId: string } | null = null;
  if (req.file) {
    photo = await uploadPhoto(req.file.buffer);
  }

  try {
    const student = await db.transaction(async (tx) => {
      const admissionNumber = await nextAdmissionNumber(tx);
      
      const { dob, ...insertData } = parsed.data;

      const [created] = await tx
        .insert(students)
        .values({
          ...insertData,
          dob: dob.toISOString().split("T")[0], // Convert Date to YYYY-MM-DD string
          admissionNumber,
          photoUrl: photo?.url ?? null,
          photoPublicId: photo?.publicId ?? null,
        })
        .returning();

      await logActivity(tx, {
        action: "CREATE",
        entityId: created.id,
        details: { admissionNumber: created.admissionNumber, name: created.name },
        actor: req.user,
      });

      return created;
    });

    res.status(201).json(student);
  } catch (err) {
    if (photo) {
      await deletePhoto(photo.publicId).catch(() => {});
    }
    throw err;
  }
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    throw new HttpError(400, "Invalid student ID");
  }

  const [existing] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  if (!existing) throw new HttpError(404, "Student not found");

  const parsed = studentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(422, "Validation failed", formatZodError(parsed.error));
  }

  let photo: { url: string; publicId: string } | null = null;
  if (req.file) {
    photo = await uploadPhoto(req.file.buffer);
  }

  try {
    const student = await db.transaction(async (tx) => {
      const { dob, ...updateData } = parsed.data;

      const [updated] = await tx
        .update(students)
        .set({
          ...updateData,
          ...(dob ? { dob: dob.toISOString().split("T")[0] } : {}),
          ...(photo ? { photoUrl: photo.url, photoPublicId: photo.publicId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(students.id, id))
        .returning();

      await logActivity(tx, {
        action: "UPDATE",
        entityId: id,
        details: { fields: Object.keys(parsed.data) },
        actor: req.user,
      });

      return updated;
    });

    if (photo && existing.photoPublicId) {
      await deletePhoto(existing.photoPublicId).catch(() => {});
    }
    
    res.json(student);
  } catch (err) {
    if (photo) {
      await deletePhoto(photo.publicId).catch(() => {});
    }
    throw err;
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    throw new HttpError(400, "Invalid student ID");
  }

  const [existing] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  if (!existing) throw new HttpError(404, "Student not found");

  await db.transaction(async (tx) => {
    await tx.delete(students).where(eq(students.id, id));
    await logActivity(tx, {
      action: "DELETE",
      entityId: id,
      details: { admissionNumber: existing.admissionNumber, name: existing.name },
      actor: req.user,
    });
  });

  if (existing.photoPublicId) {
    await deletePhoto(existing.photoPublicId).catch(() => {});
  }

  res.status(204).send();
}

export async function getStudentStats(_req: Request, res: Response): Promise<void> {
  // Query 1: Total count
  const [totalCountResult] = await db
    .select({ value: count() })
    .from(students);
  const total = totalCountResult?.value || 0;

  // Query 2: Gender distribution
  const genderStats = await db
    .select({
      gender: students.gender,
      count: count(),
    })
    .from(students)
    .groupBy(students.gender);

  // Query 3: Year distribution
  const yearStats = await db
    .select({
      year: students.year,
      count: count(),
    })
    .from(students)
    .groupBy(students.year);

  // Query 4: Course distribution
  const courseStats = await db
    .select({
      course: students.course,
      count: count(),
    })
    .from(students)
    .groupBy(students.course);

  res.json({
    total,
    gender: genderStats,
    year: yearStats,
    courses: courseStats,
  });
}

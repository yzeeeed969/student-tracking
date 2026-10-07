import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const classRooms = pgTable("class_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  order: integer("order").notNull().default(0),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  guardianName: text("guardian_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  classId: integer("class_id")
    .notNull()
    .references(() => classRooms.id),
  active: boolean("active").notNull().default(true),
  quran: doublePrecision("quran"),
  oralWritten: doublePrecision("oral_written"),
  recitation: doublePrecision("recitation"), // تلاوة سورة المدثر 0..4
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// درجات حفظ السور: points 1=جيد، 2=جيد جدًا، 3=ممتاز (القيمة = points/3)
export const quranMarks = pgTable(
  "quran_marks",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    surah: integer("surah").notNull(), // رقم السورة 99..114
    points: integer("points").notNull(), // 1..3
  },
  (t) => ({
    uq: uniqueIndex("quran_student_surah").on(t.studentId, t.surah),
  })
);

export const homeworkMarks = pgTable(
  "homework_marks",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    num: integer("num").notNull(),
    score: doublePrecision("score"),
  },
  (t) => ({
    uq: uniqueIndex("hw_student_num").on(t.studentId, t.num),
  })
);

export const participation = pgTable(
  "participation",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull().defaultNow(),
    points: doublePrecision("points").notNull().default(1),
  },
  (t) => ({ idx: index("part_student").on(t.studentId) })
);

export const behaviorNotes = pgTable(
  "behavior_notes",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull().defaultNow(),
    type: text("type").notNull(),
    category: text("category").notNull().default(""),
    description: text("description").notNull().default(""),
  },
  (t) => ({ idx: index("beh_student").on(t.studentId) })
);

export const contactLogs = pgTable("contact_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(),
  kind: text("kind").notNull(),
  message: text("message").notNull().default(""),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

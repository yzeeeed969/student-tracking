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
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; notNull: true; default: false }>({
  dataType() {
    return "bytea";
  },
});

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
  readingLevel: integer("reading_level").notNull().default(0), // 0 غير محدد،1 لا يقرأ،2 متوسط،3 يقرأ جيدًا
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

// مكتبة يوتيوب: مجلدات ومقاطع
export const videoFolders = pgTable("video_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
});

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    folderId: integer("folder_id")
      .notNull()
      .references(() => videoFolders.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    order: integer("order").notNull().default(0),
  },
  (t) => ({ idx: index("video_folder").on(t.folderId) })
);

// الكتب (ملفات PDF مخزّنة في قاعدة البيانات)
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mime: text("mime").notNull().default("application/pdf"),
  size: integer("size").notNull().default(0),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

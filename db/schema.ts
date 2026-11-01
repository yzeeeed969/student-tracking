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

// نسخة bytea تقبل القيمة الفارغة (null) — للصور الاختيارية في حائط المشاركات
const byteaNullable = customType<{ data: Buffer; notNull: false }>({
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
  // اختبارات الشفهي والتحريري: عمودان شفهي وعمودان تحريري (كل منها من 10)
  oral1: doublePrecision("oral1"),
  oral2: doublePrecision("oral2"),
  written1: doublePrecision("written1"),
  written2: doublePrecision("written2"),
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

// أوراق العمل: ورقة لكل درس (مشتركة)، باسم الدرس وصفحته، ورابطان (ثالث أول/ثاني) وحالة نشر
export const worksheets = pgTable("worksheets", {
  id: serial("id").primaryKey(),
  num: integer("num").notNull().unique(), // رقم الدرس 1..18
  title: text("title").notNull().default(""), // اسم الدرس
  page: integer("page").notNull().default(0), // صفحة الدرس في الكتاب
  urlC1: text("url_c1").notNull().default(""), // رابط ثالث أول
  urlC2: text("url_c2").notNull().default(""), // رابط ثالث ثاني
  published: boolean("published").notNull().default(false),
  order: integer("order").notNull().default(0),
});

// درجة كل طالب في كل ورقة عمل (من 10)
export const worksheetMarks = pgTable(
  "worksheet_marks",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    worksheetId: integer("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    score: doublePrecision("score"), // 0..20
  },
  (t) => ({
    uq: uniqueIndex("ws_student_worksheet").on(t.studentId, t.worksheetId),
  })
);

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

// حوائط المشاركة (مثل بادلت): لكل حائط رابط عام قصير (slug)
export const walls = pgTable("walls", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // المعرّف في الرابط العام /w/<slug>
  title: text("title").notNull(),
  goal: text("goal").notNull().default(""), // وصف/هدف الحائط (يظهر للطلاب)
  moderated: boolean("moderated").notNull().default(false), // true = تحتاج المشاركات موافقة المعلم قبل الظهور
  open: boolean("open").notNull().default(true), // true = يستقبل مشاركات جديدة
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// مشاركات الطلاب داخل الحائط
export const wallPosts = pgTable(
  "wall_posts",
  {
    id: serial("id").primaryKey(),
    wallId: integer("wall_id")
      .notNull()
      .references(() => walls.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""), // اسم الطالب
    text: text("text").notNull().default(""), // نص المشاركة (حد أقصى 500 حرف)
    image: byteaNullable("image"), // صورة اختيارية (مضغوطة) — قد تكون فارغة
    mime: text("mime").notNull().default(""), // نوع الصورة إن وُجدت
    approved: boolean("approved").notNull().default(true), // false = بانتظار موافقة المعلم
    device: text("device").notNull().default(""), // رمز الجهاز (للحدّ من التكرار السريع)
    ip: text("ip").notNull().default(""), // عنوان الشبكة (حماية إضافية)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ idx: index("wallpost_wall").on(t.wallId) })
);

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
import { sql } from "drizzle-orm";

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

// تسليمات الواجبات (صور): يرفعها ولي الأمر/الطالب من الصفحة العامة
// صورة واحدة محفوظة لكل (طالب + رقم واجب) — الرفع الجديد يستبدل القديم
export const homeworkSubmissions = pgTable(
  "homework_submissions",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    num: integer("num").notNull(), // رقم الواجب (التقويم) 1..18
    image: bytea("image").notNull(), // صورة الواجب (مضغوطة)
    mime: text("mime").notNull().default("image/jpeg"),
    device: text("device").notNull().default(""), // رمز الجهاز (للحدّ من التكرار السريع)
    ip: text("ip").notNull().default(""), // عنوان الشبكة (حماية إضافية)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uq: uniqueIndex("hwsub_student_num").on(t.studentId, t.num),
    idx: index("hwsub_created").on(t.createdAt),
  })
);

// حوائط المشاركة (مثل بادلت): لكل حائط رابط عام قصير (slug)
export const walls = pgTable("walls", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // المعرّف في الرابط العام /w/<slug>
  title: text("title").notNull(),
  goal: text("goal").notNull().default(""), // وصف/هدف الحائط (يظهر للطلاب)
  moderated: boolean("moderated").notNull().default(false), // true = تحتاج المشاركات موافقة المعلم قبل الظهور
  open: boolean("open").notNull().default(true), // true = يستقبل مشاركات جديدة
  cells: integer("cells").notNull().default(30), // عدد المربّعات (الأماكن) على اللوحة
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
    cell: integer("cell"), // رقم المربّع الذي اختاره الطالب على اللوحة (قد يكون فارغًا)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    idx: index("wallpost_wall").on(t.wallId),
    // لا يملك مربّعٌ واحد إلا مشاركةً واحدة داخل الحائط
    cellUq: uniqueIndex("wallpost_cell_uq")
      .on(t.wallId, t.cell)
      .where(sql`${t.cell} is not null`),
  })
);

// أسئلة أوراق العمل التفاعلية — اختيار من متعدد، يحلّها الطالب داخل النظام
export const worksheetQuestions = pgTable(
  "worksheet_questions",
  {
    id: serial("id").primaryKey(),
    worksheetId: integer("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    prompt: text("prompt").notNull().default(""), // نص السؤال
    options: text("options").notNull().default("[]"), // خيارات الإجابة (JSON: مصفوفة نصوص)
    correctIndex: integer("correct_index").notNull().default(0), // رقم الخيار الصحيح (يبدأ من 0)
  },
  (t) => ({
    idx: index("wsq_worksheet").on(t.worksheetId),
  })
);

// محاولات الطلاب على أوراق العمل التفاعلية (سجلّ + حدّ تكرار)
export const worksheetAttempts = pgTable(
  "worksheet_attempts",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    worksheetId: integer("worksheet_id")
      .notNull()
      .references(() => worksheets.id, { onDelete: "cascade" }),
    score: doublePrecision("score"), // الدرجة من 10
    correct: integer("correct").notNull().default(0),
    total: integer("total").notNull().default(0),
    device: text("device").notNull().default(""),
    ip: text("ip").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    idx: index("wsa_student_ws").on(t.studentId, t.worksheetId),
  })
);

// الشواهد التعليمية: ملفات يرفعها المعلم لكل بند من بنود تقييم الأداء الوظيفي (1..11)
export const evidenceFiles = pgTable(
  "evidence_files",
  {
    id: serial("id").primaryKey(),
    element: integer("element").notNull(), // رقم البند 1..11
    title: text("title").notNull(), // اسم الشاهد
    note: text("note").notNull().default(""), // وصف مختصر (اختياري)
    mime: text("mime").notNull().default("application/octet-stream"),
    size: integer("size").notNull().default(0),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ idx: index("evidence_element").on(t.element) })
);

// ===== تسميع القرآن =====
// تسجيل تسميع واحد لطالب لسورة — يُحذف تلقائيًا بعد أن يرصد المعلم الدرجة
// (يستخدم نوع bytea المعرّف أعلى الملف)
export const recitations = pgTable(
  "recitations",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    surah: integer("surah").notNull(), // 99..114
    audio: bytea("audio").notNull(), // الملف الصوتي
    mime: text("mime").notNull().default("audio/webm"),
    durationMs: integer("duration_ms").notNull().default(0),
    bytes: integer("bytes").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uq: uniqueIndex("recite_student_surah").on(t.studentId, t.surah),
  })
);

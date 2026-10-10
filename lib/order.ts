import { sql } from "drizzle-orm";
import { students } from "@/db/schema";

// ترتيب الطلاب أبجديًا حسب الاسم مع تطبيع الهمزات والألف المقصورة والتاء المربوطة
// (أ إ آ → ا، ى → ي، ة → ه) ليكون الترتيب هجائيًا سليمًا وموحّدًا في كل الصفحات
export const orderByName = sql`translate(${students.name}, 'أإآىة', 'ااايه')`;

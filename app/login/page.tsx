export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        action="/api/login"
        method="post"
        className="card p-8 w-full max-w-sm space-y-5"
      >
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-brand">نظام متابعة الطلاب</div>
          <div className="text-muted text-sm">الدراسات الإسلامية — الصف الثالث</div>
        </div>
        {e && (
          <div className="text-red-600 text-sm text-center">
            كلمة المرور غير صحيحة
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium">كلمة المرور</label>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="w-full"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn w-full">
          دخول
        </button>
      </form>
    </div>
  );
}

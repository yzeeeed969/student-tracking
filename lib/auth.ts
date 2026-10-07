import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "./token";

export { makeToken, verifyToken, SESSION_COOKIE } from "./token";

export async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  return verifyToken(c.get(SESSION_COOKIE)?.value);
}

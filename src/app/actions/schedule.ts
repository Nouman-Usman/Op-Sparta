"use server";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and, isNotNull, gte, lte, or } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const PREFERRED_SLOTS = [
  { hour: 10, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 19, minute: 0 },
] as const;

export async function getUserTimezone(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.timezone ?? null;
}

export async function saveUserTimezone(
  timezone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Auth failed" };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };
    await db.update(users).set({ timezone }).where(eq(users.id, user.id));
    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function autoSchedulePost(postId: string): Promise<
  | { success: true; scheduledFor: string; timezone: string }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Auth failed" };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [row] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row?.timezone) return { success: false, error: "NO_TIMEZONE" };

    const timezone = row.timezone;
    const slot = await findNextSlot(user.id, timezone);

    await db
      .update(posts)
      .set({ scheduledFor: slot, status: "pending", targetTimezone: timezone })
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)));

    revalidatePath("/studio");
    revalidatePath("/upload");
    revalidatePath("/planner");

    return { success: true, scheduledFor: slot.toISOString(), timezone };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function findNextSlot(userId: string, timezone: string): Promise<Date> {
  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayStr = dateFmt.format(now);
  const [ty, tm, td] = todayStr.split("-").map(Number);

  for (let offset = 0; offset < 8; offset++) {
    // Build a midday UTC timestamp for the target day to get the correct TZ date
    const midpoint = new Date(Date.UTC(ty, tm - 1, td + offset, 12, 0, 0));
    const [y, m, d] = dateFmt.format(midpoint).split("-").map(Number);

    for (const { hour, minute } of PREFERRED_SLOTS) {
      const candidate = localToUtc(y, m, d, hour, minute, timezone);

      // Must be at least 2 minutes in the future
      if (candidate.getTime() <= now.getTime() + 2 * 60 * 1000) continue;

      // Check for conflicts: any post within 60 min of this slot
      const windowStart = new Date(candidate.getTime() - 60 * 60 * 1000);
      const windowEnd = new Date(candidate.getTime() + 60 * 60 * 1000);

      const conflicts = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.userId, userId),
            isNotNull(posts.scheduledFor),
            or(eq(posts.status, "pending"), eq(posts.status, "published")),
            gte(posts.scheduledFor, windowStart),
            lte(posts.scheduledFor, windowEnd)
          )
        )
        .limit(1);

      if (conflicts.length === 0) return candidate;
    }
  }

  throw new Error("No available slot found in the next 7 days.");
}

// Convert a local time (year/month/day/hour/minute in a named timezone) to UTC.
// Uses two-pass correction for DST accuracy.
function localToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = tzOffsetMinutes(localAsUtc, timezone);
  const corrected = new Date(localAsUtc.getTime() + offset * 60000);
  const offset2 = tzOffsetMinutes(corrected, timezone);
  return new Date(localAsUtc.getTime() + offset2 * 60000);
}

// Returns (utcDate − local_time_displayed_as_utc) in minutes.
// Positive for timezones west of UTC (e.g. America/New_York = +240 in EDT).
function tzOffsetMinutes(utcDate: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(utcDate);

  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);

  const localAsUtc = new Date(
    Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"))
  );
  return (utcDate.getTime() - localAsUtc.getTime()) / 60000;
}

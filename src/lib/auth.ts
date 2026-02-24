import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Cached per-request auth lookup. Safe to call from layout + page
 * without hitting Supabase twice in the same render pass.
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Ensure a matching record exists in the users table (only write if missing)
  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existing) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata?.name ?? null,
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? null,
      },
    });
  }

  return user;
});

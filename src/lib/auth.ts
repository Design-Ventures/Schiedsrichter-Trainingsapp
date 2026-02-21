import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Ensure a matching record exists in the users table
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

  return user;
}

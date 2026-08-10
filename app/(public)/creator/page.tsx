import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CreatorIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.handle) {
      redirect(`/creator/${profile.handle}`);
    }
  }

  redirect("/shop");
}

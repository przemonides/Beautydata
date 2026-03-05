import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentSalon() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("owner_email", user.email!)
    .single();

  if (!salon) {
    // Auto-create salon for new users
    const { data: newSalon } = await supabase
      .from("salons")
      .insert({
        name: "Mój Salon",
        owner_email: user.email!,
      })
      .select()
      .single();

    return newSalon!;
  }

  return salon;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccesoForm } from "@/components/acceso-form";

export default async function AccesoPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return <AccesoForm />;
}

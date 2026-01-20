import { createClient } from "@/lib/supabase/server";
import ClientPage from "./client";
import { redirect } from "next/navigation";

export default async function LeadsReportPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reports } = await supabase
    .from("report_leads")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Safety check if profile is somehow missing
  const userName = profile?.full_name || profile?.email || "Marketing";

  return <ClientPage initialReports={reports || []} userName={userName} />;
}

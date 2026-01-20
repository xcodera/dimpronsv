import { createClient } from "@/lib/supabase/server";
import ClientPage from "./client";
import { redirect } from "next/navigation";

export default async function AdsReportPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch reports for recent history checking
  // Include profile info to show names
  const { data: reports } = await supabase
    .from("report_ads")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch profiles with role 'Inhouse' to list as Marketers
  // This aligns with "Staff Ops reporting for Marketers" workflow
  let { data: marketers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'Inhouse')
    .order('full_name');

  // Fallback: If no Inhouse users found, fetch all to avoid empty state during dev/testing
  if (!marketers || marketers.length === 0) {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name');
    marketers = allProfiles;
  }

  const userName = profile?.full_name || profile?.email || "Advertiser";

  return <ClientPage initialReports={reports || []} marketers={marketers || []} userName={userName} />;
}

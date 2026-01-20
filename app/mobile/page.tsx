import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Megaphone,
  ShieldAlert,
  UserCheck,
  Users,
  Search,
  TrendingUp,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import DashboardClient from "./_components/dashboard-client";

type Activity = {
  id: string;
  type: "Absensi" | "Slik" | "Laporan";
  title: string;
  status: string;
  timestamp: string;
};

export default async function MobileDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // This case might happen if the trigger failed.
    // We should probably sign them out and ask them to sign up again.
    redirect("/login");
  }

  // Fetch performance stats (aggregation)
  const { count: totalLeads, error: leadsError } = await supabase
    .from("report_leads")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const { count: totalSliks, error: sliksError } = await supabase
    .from("sliks")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id);

  // Fetch recent activities (a simplified union for demonstration)
  const { data: attendanceActivities } = await supabase
    .from('attendance')
    .select('attendance_id, created_at, status')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: reportActivities } = await supabase
    .from('report_leads')
    .select('report_id, created_at, total_leads')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(2);

  // Fix: Explicitly cast 'type' property to a literal type to prevent type widening and resolve TypeScript error.
  const combinedActivities: Activity[] = [
    ...(attendanceActivities || []).map(a => ({ id: a.attendance_id, type: 'Absensi' as 'Absensi', title: `Clock In/Out`, status: a.status, timestamp: a.created_at })),
    ...(reportActivities || []).map(r => ({ id: r.report_id, type: 'Laporan' as 'Laporan', title: `Laporan Dibuat`, status: `Leads: ${r.total_leads}`, timestamp: r.created_at }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const performanceStats = {
    totalLeads: totalLeads ?? 0,
    totalSliks: totalSliks ?? 0,
    peningkatanPenjualan: "15.7%", // Mock data as calculation is complex
    totalBAST: 31, // Mock data
  };

  const formatActivityTime = (ts: string) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case 'Absensi': return { icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: 'bg-green-900/30' };
      case 'Slik': return { icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-900/30' };
      case 'Laporan': return { icon: <BarChart3 className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-900/30' };
      default: return { icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: 'bg-green-900/30' };
    }
  }

  return (
    <DashboardClient
      profile={profile}
      stats={performanceStats}
      activities={combinedActivities}
    />
  );
}
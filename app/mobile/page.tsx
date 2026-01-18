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
    switch(type) {
      case 'Absensi': return { icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: 'bg-green-900/30' };
      case 'Slik': return { icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-900/30' };
      case 'Laporan': return { icon: <BarChart3 className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-900/30' };
      default: return { icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: 'bg-green-900/30' };
    }
  }

  return (
    <>
      <DashboardClient profile={profile} />

      <div className="px-6 pt-8 pb-8 space-y-8">
        {/* Services Grid */}
        <div className="grid grid-cols-4 gap-y-6">
          <Link href="/mobile/attendance" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-active:scale-90 transition-all border bg-white/5 border-white/10 group-hover:bg-white/10"><UserCheck className="w-6 h-6 text-red-500" /></div><span className="text-[11px] font-bold text-gray-400">Absensi</span>
          </Link>
          <Link href="/mobile/sliks" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-active:scale-90 transition-all border bg-white/5 border-white/10 group-hover:bg-white/10"><ShieldAlert className="w-6 h-6 text-indigo-500" /></div><span className="text-[11px] font-bold text-gray-400">SLIKs</span>
          </Link>
          <Link href="/mobile/reports/leads" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-active:scale-90 transition-all border bg-white/5 border-white/10 group-hover:bg-white/10"><BarChart3 className="w-6 h-6 text-yellow-600" /></div><span className="text-[11px] font-bold text-gray-400">Laporan</span>
          </Link>
          <Link href="/mobile/reports/ads" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-active:scale-90 transition-all border bg-white/5 border-white/10 group-hover:bg-white/10"><Megaphone className="w-6 h-6 text-cyan-500" /></div><span className="text-[11px] font-bold text-gray-400">Reports Ads</span>
          </Link>
        </div>

        {/* Kinerja */}
        <div className="space-y-4">
          <h3 className="font-bold px-1 text-gray-200">Ringkasan Akun & Kinerja</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-3xl border transition-all shadow-sm bg-[#1e293b] border-white/5"><div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-white/5"><Users className="w-5 h-5 text-blue-500" /></div><p className="text-[11px] font-bold leading-tight text-gray-400">Total Leads</p></div><p className="text-lg font-black tracking-tight leading-none text-white">{performanceStats.totalLeads}</p><p className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-gray-500">Bulan Ini</p></div>
            <div className="p-4 rounded-3xl border transition-all shadow-sm bg-[#1e293b] border-white/5"><div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-white/5"><Search className="w-5 h-5 text-yellow-500" /></div><p className="text-[11px] font-bold leading-tight text-gray-400">Total Sliks</p></div><p className="text-lg font-black tracking-tight leading-none text-white">{performanceStats.totalSliks}</p><p className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-gray-500">Bulan Ini</p></div>
            <div className="p-4 rounded-3xl border transition-all shadow-sm bg-[#1e293b] border-white/5"><div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-white/5"><TrendingUp className="w-5 h-5 text-green-500" /></div><p className="text-[11px] font-bold leading-tight text-gray-400">Peningkatan Penjualan</p></div><p className="text-lg font-black tracking-tight leading-none text-white">{performanceStats.peningkatanPenjualan}</p><p className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-gray-500">+12% target</p></div>
            <div className="p-4 rounded-3xl border transition-all shadow-sm bg-[#1e293b] border-white/5"><div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-white/5"><Landmark className="w-5 h-5 text-indigo-500" /></div><p className="text-[11px] font-bold leading-tight text-gray-400">Total BAST</p></div><p className="text-lg font-black tracking-tight leading-none text-white">{performanceStats.totalBAST}</p><p className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-gray-500">Terverifikasi</p></div>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-gray-200">Aktivitas Terakhir</h3>
            <Link href="/mobile/history" className="text-xs font-black uppercase tracking-widest text-blue-400">Lihat Semua</Link>
          </div>
          <div className="rounded-[2.2rem] overflow-hidden shadow-sm border transition-all bg-[#1e293b] border-white/5">
            <div className="divide-y divide-white/5">
              {combinedActivities.map(activity => (
                <div key={activity.id} className="p-4 flex justify-between items-center active:bg-gray-500/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${getActivityIcon(activity.type).bg}`}>{getActivityIcon(activity.type).icon}</div>
                    <div className="flex flex-col">
                      <p className="font-bold text-sm leading-none text-gray-100">{activity.title}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 leading-none">{activity.status}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm leading-none text-gray-200">{formatActivityTime(activity.timestamp)}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase mt-0.5 leading-none">{activity.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
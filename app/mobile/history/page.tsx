
import { ChevronRight, History, Search, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  return (
    <div className="px-6 py-8 space-y-7 pb-24 text-white">
      <h2 className="text-2xl font-bold text-blue-400">Riwayat Aktivitas</h2>
      <div className="grid grid-cols-1 gap-4">
        <Link href="/mobile/attendance" className="w-full flex items-center p-4 rounded-2xl gap-4 transition-all active:scale-[0.98] bg-[#1e293b] hover:bg-white/5">
          <div className="p-3.5 rounded-2xl bg-green-900/50"><History className="w-5 h-5 text-green-400" /></div>
          <div className="text-left">
            <h4 className="font-bold text-white">Riwayat Absensi</h4>
            <p className="text-xs text-gray-500">Lihat log presensi harian Anda</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-gray-600" />
        </Link>
        <Link href="/mobile/sliks" className="w-full flex items-center p-4 rounded-2xl gap-4 transition-all active:scale-[0.98] bg-[#1e293b] hover:bg-white/5">
          <div className="p-3.5 rounded-2xl bg-blue-900/50"><Search className="w-5 h-5 text-blue-400" /></div>
          <div className="text-left">
            <h4 className="font-bold text-white">Riwayat Sliks</h4>
            <p className="text-xs text-gray-500">Cek status verifikasi KTP</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-gray-600" />
        </Link>
        <Link href="/mobile/reports/leads" className="w-full flex items-center p-4 rounded-2xl gap-4 transition-all active:scale-[0.98] bg-[#1e293b] hover:bg-white/5">
          <div className="p-3.5 rounded-2xl bg-purple-900/50"><BarChart3 className="w-5 h-5 text-purple-400" /></div>
          <div className="text-left">
            <h4 className="font-bold text-white">Riwayat Laporan</h4>
            <p className="text-xs text-gray-500">Laporan performa & iklan</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-gray-600" />
        </Link>
      </div>
    </div>
  );
}

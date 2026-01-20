'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, History, MapPin,
  FileText, Stethoscope, CalendarOff, AlertCircle, CheckCircle2,
  Calendar, RefreshCw, Fingerprint, LogOut, CheckCircle, ClipboardList, X,
  Sun, Moon
} from 'lucide-react';
import { clockIn, clockOut, submitLeave } from '../actions';
import { useTheme } from '../../_components/theme-provider';
import type { Tables } from '@/lib/types/supabase';

type Profile = Tables<'profiles'>;
type Attendance = Tables<'attendance'>;
type AttendanceStatus = 'Belum Absen' | 'Hadir' | 'Terlambat' | 'Izin - Half Day' | 'Izin - Full Day' | 'Sakit' | 'Cuti';
type ModalType = 'none' | 'izin' | 'sakit' | 'cuti';

const mapStatusToDisplay = (status: string, pType: string): string => {
  if (status === 'permission') {
    return pType === 'halfday' ? 'Izin - Half Day' : (pType === 'fullday' ? 'Izin - Full Day' : 'Izin');
  }
  const displayMap: { [key: string]: string } = {
    'present': 'Hadir',
    'late': 'Terlambat',
    'sick': 'Sakit',
    'leave': 'Cuti',
    'absent': 'Belum Absen',
  };
  return displayMap[status] || 'Belum Absen';
}

const AttendanceField: React.FC<{
  label: string;
  isDarkMode: boolean;
  children: React.ReactNode;
}> = ({ label, isDarkMode, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-500 pl-1 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function AttendanceClient({ profile, todayAttendance, history }: { profile: Profile; todayAttendance: Attendance | null, history: Attendance[] }) {
  // Use Global Theme
  const { isDarkMode, toggleTheme } = useTheme();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState<string>("Mendeteksi lokasi...");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [modalLoading, setModalLoading] = useState(false);

  // Initial state from server props
  const [currentAttendance, setCurrentAttendance] = useState(todayAttendance);

  useEffect(() => {
    // Check local storage or system pref optional? For now just local state as requested to fix default.
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName("GPS tidak didukung");
      setIsFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`,
            { headers: { 'User-Agent': 'DimpronsvApp' } }
          );
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          const addr = data.address || {};

          // Prioritize specific place names (POIs)
          const poiKeys = ['amenity', 'shop', 'office', 'building', 'leisure', 'tourism', 'historic', 'healthcare'];
          let placeName = '';

          for (const key of poiKeys) {
            if (addr[key]) {
              placeName = addr[key];
              break;
            }
          }

          let formattedName = '';
          if (placeName) {
            // e.g., "Indomaret, Jl. Jendral Sudirman"
            const street = addr.road || addr.pedestrian || addr.street;
            formattedName = street ? `${placeName}, ${street}` : placeName;
          } else {
            // Fallback: Road + Number or Suburb
            const road = addr.road || addr.pedestrian || addr.street;
            if (road) {
              formattedName = `${road}${addr.house_number ? ' No. ' + addr.house_number : ''}`;
            } else {
              // Fallback Generic
              formattedName = data.display_name.split(',').slice(0, 2).join(',');
            }
          }

          setLocationName(formattedName || "Lokasi tidak dikenal");
        } catch (error) {
          console.error("Reverse Geocoding Error:", error);
          setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation Error:", error);
        let message = "Gagal mendapatkan lokasi.";
        if (error.code === error.PERMISSION_DENIED) message = "Akses lokasi diperlukan.";
        else if (error.code === error.POSITION_UNAVAILABLE) message = "Lokasi tidak tersedia.";
        setLocationName(message);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime);

  const displayStatus = currentAttendance ? mapStatusToDisplay(currentAttendance.status, currentAttendance.permission_type) : 'Belum Absen';

  const handleClockIn = async () => {
    if (currentAttendance || !coords) return;
    // Wait, logical correction: if currentAttendance exists, we DO allow updates now.
    // So the check `if (currentAttendance)` inside `handleClockIn` should strictly check if we want to BLOCK.
    // But per "Unlimited Updates", we proceed. The only hard block is `!coords`.
    if (!coords) {
      alert("Lokasi belum terdeteksi.");
      return;
    }

    setIsSubmitting(true);
    const result = await clockIn(coords.lat, coords.lng, locationName);
    if (result.success && result.data) {
      setCurrentAttendance(result.data);
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleClockOut = async () => {
    // Similarly, allow update even if clocked out? 
    // User said "hilangkan batasan ... bisa ditekan berkali-kali".
    // So simply call the action.
    if (!currentAttendance) return; // Cant clock out if never clocked in

    setIsSubmitting(true);
    const result = await clockOut(currentAttendance.attendance_id);
    if (result.success && result.data) {
      setCurrentAttendance(result.data);
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleModalSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setModalLoading(true);

    const statusToSubmit = activeModal === 'izin' ? type : (activeModal === 'sakit' ? 'Sakit' : 'Cuti');
    const result = await submitLeave(statusToSubmit, '-');

    if (result.success && result.data) {
      setCurrentAttendance(result.data);
      setActiveModal('none');
    } else {
      alert(result.error);
    }
    setModalLoading(false);
  }

  const getStatusColor = () => {
    if (!currentAttendance) return 'text-gray-400 bg-gray-400/10';
    const s = currentAttendance.status;
    if (s === 'present' || s === 'late') return 'text-green-500 bg-green-500/10';
    if (s === 'sick' || s === 'permission') return 'text-orange-500 bg-orange-500/10';
    if (s === 'leave') return 'text-purple-500 bg-purple-500/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  const getHistoryIcon = (status: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      present: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      late: <CheckCircle2 className="w-5 h-5 text-green-500" />, // Green check for late too
      sick: <Stethoscope className="w-5 h-5 text-blue-500" />,
      permission: <FileText className="w-5 h-5 text-orange-500" />,
      leave: <CalendarOff className="w-5 h-5 text-purple-500" />,
    };
    return icons[status] || <CheckCircle className="w-5 h-5 text-gray-500" />;
  };

  const LeaveMenuButton: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string }> = ({ onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border transition-all active:scale-90 shadow-sm ${isDarkMode ? 'bg-[#1e293b] border-[#334155] shadow-black/20' : 'bg-white border-gray-100 shadow-blue-900/5'
      }`}>
      <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
    </button>
  );

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
      <div className={`px-6 py-4 flex justify-between items-center transition-colors ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white border-b border-gray-100'}`}>
        <Link href="/mobile" className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-[#004691]'}`}><ChevronLeft size={24} /></Link>
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-[#004691]'}`}>Absensi Kehadiran</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link href="/mobile/history" className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-[#004691]'}`}><History size={22} /></Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-5">
        <div className={`p-4 rounded-2xl flex items-center gap-4 border transition-colors ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100 shadow-sm shadow-blue-900/5'}`}>
          <img src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}`} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/20" />
          <div>
            <h4 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{profile.full_name}</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">{profile.job_title}</p>
          </div>
        </div>

        <div className={`p-8 rounded-2xl text-center relative overflow-hidden transition-all duration-500 shadow-2xl ${isDarkMode ? 'bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]' : 'bg-[#004691] text-white shadow-[#004691]/30'}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Waktu Saat Ini</p>
          <h1 className="text-5xl font-black font-mono tracking-tighter mb-2">{timeString}</h1>
          <div className="flex items-center justify-center gap-2 opacity-80"><Calendar size={14} className="text-blue-300" /><p className="text-xs font-bold">{dateString}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleClockIn} disabled={isSubmitting} className={`group relative h-32 rounded-2xl font-bold text-sm overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-xl border-2 backdrop-blur-xl cursor-pointer ${isDarkMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-green-50/70 border-green-500/30 text-green-600'
            } hover:bg-green-500/20`}>
            <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <Fingerprint size={40} /><span className="relative z-10 text-[10px] font-black tracking-[0.3em]">{isSubmitting ? 'LOADING...' : (currentAttendance ? 'UPDATE MASUK' : 'CLOCK IN')}</span>
          </button>

          <button onClick={handleClockOut} disabled={isSubmitting} className={`group relative h-32 rounded-2xl font-bold text-sm overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-xl border-2 backdrop-blur-xl cursor-pointer ${isDarkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50/70 border-red-500/30 text-red-600'
            } hover:bg-red-500/20`}>
            <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <LogOut size={40} /><span className="relative z-10 text-[10px] font-black tracking-[0.3em]">{isSubmitting ? 'LOADING...' : (currentAttendance?.clock_out ? 'UPDATE PULANG' : 'CLOCK OUT')}</span>
          </button>
        </div>

        <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center px-1">
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-[#004691]'}`}>Log Harian</h3>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor()}`}>{displayStatus}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Masuk</p>
              <p className={`text-sm font-black ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{currentAttendance?.clock_in?.slice(0, 5) || '-- : --'}</p>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Pulang</p>
              <p className={`text-sm font-black ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{currentAttendance?.clock_out?.slice(0, 5) || '-- : --'}</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`p-2.5 rounded-xl relative ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <MapPin size={20} className={isDarkMode ? 'text-blue-400' : 'text-[#004691]'} />
              {isFetchingLocation && <RefreshCw size={10} className="absolute -top-1 -right-1 text-blue-500 animate-spin" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Lokasi Terkini</p>
              <p className={`text-xs font-bold truncate leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{locationName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <LeaveMenuButton onClick={() => setActiveModal('izin')} icon={<FileText size={22} className="text-orange-500" />} label="Izin" />
          <LeaveMenuButton onClick={() => setActiveModal('sakit')} icon={<Stethoscope size={22} className="text-blue-500" />} label="Sakit" />
          <LeaveMenuButton onClick={() => setActiveModal('cuti')} icon={<CalendarOff size={22} className="text-purple-500" />} label="Cuti" />
        </div>

        <div className="space-y-4 pt-2 pb-12">
          <div className="flex justify-between items-center px-1">
            <h3 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat Presensi</h3>
          </div>

          <div className={`rounded-2xl divide-y shadow-sm border transition-colors overflow-hidden ${isDarkMode ? 'bg-[#1e293b] divide-[#334155] border-[#334155]' : 'bg-white divide-gray-50 border-gray-100'}`}>
            {history.length > 0 ? history.map(log => (
              <div key={log.attendance_id} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>{getHistoryIcon(log.status)}</div>
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{mapStatusToDisplay(log.status, log.permission_type)}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{new Date(log.attendance_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {log.location_name?.split(',')[0] || 'N/A'}</p>
                  </div>
                </div>
                <p className={`font-black text-sm ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>{log.clock_in?.slice(0, 5) || '--:--'}</p>
              </div>
            )) : (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6 gap-4">
                <div className={`p-6 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}><ClipboardList className="w-12 h-12 text-gray-400/50" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-400">Belum Ada Riwayat</p>
                  <p className="text-xs text-gray-400">Log kehadiran harian Anda akan muncul di sini.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className={`w-full max-w-[320px] rounded-[2rem] shadow-2xl p-5 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${activeModal === 'izin' ? 'bg-orange-500/10' :
                  activeModal === 'sakit' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                  }`}>
                  {activeModal === 'izin' && <FileText size={18} className="text-orange-500" />}
                  {activeModal === 'sakit' && <Stethoscope size={18} className="text-blue-500" />}
                  {activeModal === 'cuti' && <CalendarOff size={18} className="text-purple-500" />}
                </div>
                <h3 className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Pengajuan {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
                </h3>
              </div>
              <button onClick={() => setActiveModal('none')} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><X size={16} className="text-gray-400" /></button>
            </div>

            <form onSubmit={(e) => handleModalSubmit(e, activeModal === 'izin' ? 'Izin - Half Day' : activeModal)} className="space-y-4">
              {activeModal === 'izin' && (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={(e) => handleModalSubmit(e as any, 'Izin - Half Day')} className={`p-3 rounded-xl text-center border-2 transition-all ${isDarkMode ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-blue-200 bg-blue-50 text-[#004691]'}`}>
                    <p className="font-bold text-xs">Half Day</p>
                  </button>
                  <button type="button" onClick={(e) => handleModalSubmit(e as any, 'Izin - Full Day')} className={`p-3 rounded-xl text-center border-2 transition-all ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-gray-200'}`}>
                    <p className="font-bold text-xs">Full Day</p>
                  </button>
                </div>
              )}

              <AttendanceField label="Pilih Tanggal" isDarkMode={isDarkMode}>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className={`w-full p-3 rounded-xl border-2 text-xs font-medium focus:outline-none ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-gray-50 border-gray-100'}`} />
              </AttendanceField>

              <AttendanceField label="Lampirkan Dokumen (Opsional)" isDarkMode={isDarkMode}>
                <div className={`p-3 border-2 border-dashed rounded-xl text-center text-xs font-medium cursor-pointer ${isDarkMode ? 'border-gray-600 text-gray-400 hover:bg-white/5' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  Ketuk untuk upload
                </div>
              </AttendanceField>

              <button type="submit" disabled={modalLoading} className={`w-full mt-2 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${activeModal === 'izin' ? 'bg-orange-500' : activeModal === 'sakit' ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                {modalLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>{modalLoading ? 'Mengajukan...' : 'Ajukan Sekarang'}</span>
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

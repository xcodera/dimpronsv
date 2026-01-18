
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, History, MapPin, 
  FileText, Stethoscope, CalendarOff, AlertCircle, CheckCircle2, 
  Calendar, RefreshCw, Fingerprint, LogOut, CheckCircle, ClipboardList
} from 'lucide-react';
import { clockIn, clockOut, submitLeave } from '../actions';
import type { Tables } from '@/lib/types/supabase';

type Profile = Tables<'profiles'>;
type Attendance = Tables<'attendance'>;

const mapStatusToDisplay = (status: string, pType: string): string => {
    if (status === 'permission') {
        return pType === 'halfday' ? 'Izin - Half Day' : 'Izin - Full Day';
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

export default function AttendanceClient({ profile, todayAttendance, history }: { profile: Profile; todayAttendance: Attendance | null, history: Attendance[] }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState<string>("Mendeteksi lokasi...");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial state from server props
  const [currentAttendance, setCurrentAttendance] = useState(todayAttendance);

  useEffect(() => {
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
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        setIsFetchingLocation(false);
      },
      (error) => {
        setLocationName("Akses lokasi ditolak/gagal.");
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);
  
  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime);
  
  const displayStatus = currentAttendance ? mapStatusToDisplay(currentAttendance.status, currentAttendance.permission_type) : 'Belum Absen';

  const handleClockIn = async () => {
    if (currentAttendance || !coords) return;
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
    if (!currentAttendance || currentAttendance.clock_out) return;
    setIsSubmitting(true);
    const result = await clockOut(currentAttendance.attendance_id);
    if (result.success && result.data) {
        setCurrentAttendance(result.data);
    } else {
        alert(result.error);
    }
    setIsSubmitting(false);
  };

  const getStatusColor = () => {
    if (!currentAttendance) return 'text-gray-400 bg-gray-400/10';
    switch (currentAttendance.status) {
      case 'present': return 'text-green-500 bg-green-500/10';
      case 'late': return 'text-red-500 bg-red-500/10';
      case 'sick': case 'permission': return 'text-orange-500 bg-orange-500/10';
      case 'leave': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getHistoryIcon = (status: string) => {
    const icons: { [key: string]: React.ReactNode } = {
        present: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        late: <AlertCircle className="w-5 h-5 text-red-500" />,
        sick: <Stethoscope className="w-5 h-5 text-blue-500" />,
        permission: <FileText className="w-5 h-5 text-orange-500" />,
        leave: <CalendarOff className="w-5 h-5 text-purple-500" />,
    };
    return icons[status] || <CheckCircle className="w-5 h-5 text-gray-500" />;
  };

  return (
     <div className="flex flex-col h-full bg-[#0f172a] text-white">
      <div className="px-6 py-4 flex justify-between items-center bg-[#1e293b]">
        <Link href="/mobile" className="p-2 rounded-full hover:bg-white/10 text-gray-200"><ChevronLeft size={24} /></Link>
        <h2 className="text-lg font-bold text-gray-100">Absensi Kehadiran</h2>
        <Link href="/mobile/history" className="p-2 rounded-full hover:bg-white/10 text-gray-200"><History size={22} /></Link>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-5">
        <div className="p-4 rounded-2xl flex items-center gap-4 border bg-[#1e293b] border-[#334155]">
          <img src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}`} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/20" />
          <div>
            <h4 className="font-bold text-sm leading-tight text-gray-100">{profile.full_name}</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">{profile.job_title}</p>
          </div>
        </div>
        
        <div className="p-8 rounded-2xl text-center relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Waktu Saat Ini</p>
           <h1 className="text-5xl font-black font-mono tracking-tighter mb-2">{timeString}</h1>
           <div className="flex items-center justify-center gap-2 opacity-80"><Calendar size={14} className="text-blue-300" /><p className="text-xs font-bold">{dateString}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleClockIn} disabled={!!currentAttendance || isSubmitting || isFetchingLocation} className="group relative h-32 rounded-2xl font-bold text-sm overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-xl border-2 backdrop-blur-xl border-green-500/30 text-green-400 bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed">
            <Fingerprint size={40} /><span className="relative z-10 text-[10px] font-black tracking-[0.3em]">{isSubmitting ? 'LOADING...' : 'CLOCK IN'}</span>
          </button>
          
          <button onClick={handleClockOut} disabled={!currentAttendance || !!currentAttendance.clock_out || isSubmitting} className="group relative h-32 rounded-2xl font-bold text-sm overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-xl border-2 backdrop-blur-xl border-red-500/30 text-red-400 bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed">
            <LogOut size={40} /><span className="relative z-10 text-[10px] font-black tracking-[0.3em]">{isSubmitting ? 'LOADING...' : 'CLOCK OUT'}</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl border space-y-4 shadow-sm bg-[#1e293b] border-[#334155]">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Log Harian</h3>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor()}`}>{displayStatus}</div>
            </div>
            <div className="p-4 rounded-2xl border flex items-center gap-3 bg-[#0f172a] border-[#334155]">
                <div className="p-2.5 rounded-xl relative bg-blue-900/30">
                    <MapPin size={20} className="text-blue-400" />
                    {isFetchingLocation && <RefreshCw size={10} className="absolute -top-1 -right-1 text-blue-500 animate-spin" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Lokasi Terkini</p><p className="text-xs font-bold truncate leading-relaxed text-gray-200">{locationName}</p></div>
            </div>
        </div>

        <div className="space-y-4 pt-2 pb-12">
           <h3 className="font-bold px-1 text-gray-200">Riwayat Presensi</h3>
           <div className="rounded-2xl divide-y shadow-sm border transition-colors overflow-hidden bg-[#1e293b] divide-[#334155] border-[#334155]">
                {history.length > 0 ? history.map(log => (
                  <div key={log.attendance_id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-white/5">{getHistoryIcon(log.status)}</div>
                      <div>
                        <p className="font-bold text-sm text-gray-100">{mapStatusToDisplay(log.status, log.permission_type)}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{new Date(log.attendance_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} • {log.location_name?.split(',')[0] || 'N/A'}</p>
                      </div>
                    </div>
                    <p className="font-black text-sm text-gray-200">{log.clock_in || '--:--'}</p>
                  </div>
                )) : (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6 gap-4">
                  <div className="p-6 rounded-full bg-white/5"><ClipboardList className="w-12 h-12 text-gray-400/50" /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-400">Belum Ada Riwayat</p>
                    <p className="text-xs text-gray-400">Log kehadiran harian Anda akan muncul di sini.</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, History, MapPin, Clock, LogIn, LogOut, 
  FileText, Stethoscope, CalendarOff, AlertCircle, CheckCircle2, 
  Calendar, Timer, ArrowRight, RefreshCw, Fingerprint, X,
  ClipboardList, ChevronRight
} from 'lucide-react';
import { AppView, Activity, AccountInfo } from '../types';

interface AttendanceProps {
  isDarkMode: boolean;
  setActiveView: (view: AppView) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  currentUser: AccountInfo;
}

type AttendanceStatus = 'Belum Absen' | 'Hadir' | 'Terlambat' | 'Izin - Half Day' | 'Izin - Full Day' | 'Sakit' | 'Cuti';
type ModalType = 'none' | 'izin' | 'sakit' | 'cuti';

interface AttendanceLog {
  id: string;
  date: string;
  time: string;
  status: string;
  location: string;
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

const Attendance: React.FC<AttendanceProps> = ({ isDarkMode, setActiveView, addActivity, currentUser }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Mendeteksi lokasi...");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>('Belum Absen');
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceLog[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [modalLoading, setModalLoading] = useState(false);

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
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        try {
          const response = await fetch( // FIX: Moved accept-language to URL query to prevent potential CORS issues.
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`,
            {
              headers: {
                'User-Agent': 'myBCA-Clone-App'
              }
            }
          );
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          const name = data.display_name.split(',').slice(0, 3).join(',');
          setLocationName(name || "Lokasi tidak dikenal");
        } catch (error) {
          console.error("Reverse Geocoding Error:", error);
          setLocationName(`Gagal mengambil nama lokasi.`);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation Error:", error);
        let message = "Gagal mendapatkan lokasi.";
        if (error.code === error.PERMISSION_DENIED) {
            message = "Akses lokasi diperlukan untuk absensi.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = "Informasi lokasi tidak tersedia.";
        }
        setLocationName(message);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime);

  const addHistoryEntry = (newStatus: string, time: string) => {
    const now = new Date();
    const entry: AttendanceLog = {
      id: Date.now().toString(),
      date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(now),
      time: time,
      status: newStatus,
      location: locationName.split(',')[0] || "Lokasi Terdeteksi"
    };
    setAttendanceHistory(prev => [entry, ...prev].slice(0, 5));
  };

  const handleClockIn = () => {
    if (!clockInTime) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setClockInTime(timeStr);
      let newStatus: AttendanceStatus = 'Hadir';
      if (hours > 9 || (hours === 9 && minutes > 15)) newStatus = 'Terlambat';
      setStatus(newStatus);
      addHistoryEntry(newStatus, timeStr);
      addActivity({
        type: 'Absensi',
        title: 'Clock In',
        status: newStatus === 'Hadir' ? 'Hadir Tepat Waktu' : 'Terlambat Datang'
      });
    }
  };

  const handleClockOut = () => {
    if (clockInTime && !clockOutTime) {
      const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setClockOutTime(timeStr);
      addActivity({ type: 'Absensi', title: 'Clock Out', status: 'Selesai Kerja' });
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Hadir': return 'text-green-500 bg-green-500/10';
      case 'Terlambat': return 'text-red-500 bg-red-500/10';
      case 'Sakit': case 'Izin - Full Day': case 'Izin - Half Day': return 'text-orange-500 bg-orange-500/10';
      case 'Cuti': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const handleModalSubmit = (e: React.FormEvent, finalStatus: AttendanceStatus) => {
    e.preventDefault();
    setModalLoading(true);
    setTimeout(() => {
      const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (!clockInTime) setClockInTime(timeStr);
      setStatus(finalStatus);
      addHistoryEntry(finalStatus, timeStr);
      addActivity({ type: 'Absensi', title: `Pengajuan ${finalStatus}`, status: 'Berhasil Diajukan' });
      setModalLoading(false);
      setActiveModal('none');
    }, 1500);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
      <div className={`px-6 py-4 flex justify-between items-center transition-colors ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white border-b border-gray-100'}`}>
        <button onClick={() => setActiveView('home')} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-[#004691]'}`}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-[#004691]'}`}>Absensi Kehadiran</h2>
        <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-[#004691]'}`}>
          <History size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-5">
        <div className={`p-4 rounded-2xl flex items-center gap-4 border transition-colors ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100 shadow-sm shadow-blue-900/5'}`}>
          <div className="w-12 h-12 bg-cover bg-center rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20" style={{backgroundImage: `url(${currentUser.avatarUrl})`}}>
          </div>
          <div className="flex flex-col">
            <h4 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{currentUser.name}</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">{currentUser.jobTitle}</p>
          </div>
        </div>

        <div className={`p-8 rounded-2xl text-center relative overflow-hidden transition-all duration-500 shadow-2xl ${isDarkMode ? 'bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]' : 'bg-[#004691] text-white shadow-[#004691]/30'}`}>
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Waktu Saat Ini</p>
           <h1 className="text-5xl font-black font-mono tracking-tighter mb-2">{timeString}</h1>
           <div className="flex items-center justify-center gap-2 opacity-80">
              <Calendar size={14} className="text-blue-300" />
              <p className="text-xs font-bold">{dateString}</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleClockIn}
            disabled={!!clockInTime || status !== 'Belum Absen'}
            className={`group relative h-32 rounded-2xl font-bold text-sm overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-xl border-2 backdrop-blur-xl ${
              clockInTime || status !== 'Belum Absen'
              ? 'bg-gray-200/50 border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
              : `border-green-500/30 text-green-600 ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50/70'}`
            }`}
          >
            <div className={`absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 ${clockInTime ? 'hidden' : ''}`}></div>
            <Fingerprint size={40} className={`relative z-10 transition-colors duration-300 ${!clockInTime && status === 'Belum Absen' ? 'group-hover:text-white' : ''}`} />
            <span className={`relative z-10 text-[10px] font-black tracking-[0.3em] transition-colors duration-300 ${!clockInTime && status === 'Belum Absen' ? 'group-hover:text-white' : ''}`}>CLOCK IN</span>
          </button>
          
          <button 
            onClick={handleClockOut}
            disabled={!clockInTime || !!clockOutTime}
            className={`group relative h-32 rounded-2xl font-bold text-sm overflow-hidden transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-xl border-2 backdrop-blur-xl ${
              !clockInTime || clockOutTime
              ? 'bg-gray-200/50 border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
              : `border-red-500/30 text-red-600 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50/70'}`
            }`}
          >
            <div className={`absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 ${(!clockInTime || clockOutTime) ? 'hidden' : ''}`}></div>
            <LogOut size={40} className={`relative z-10 transition-colors duration-300 ${clockInTime && !clockOutTime ? 'group-hover:text-white' : ''}`} />
            <span className={`relative z-10 text-[10px] font-black tracking-[0.3em] transition-colors duration-300 ${clockInTime && !clockOutTime ? 'group-hover:text-white' : ''}`}>CLOCK OUT</span>
          </button>
        </div>

        <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center px-1">
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-[#004691]'}`}>Log Harian</h3>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor()}`}>
              {status}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Masuk</p>
              <p className={`text-sm font-black ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{clockInTime || '-- : --'}</p>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Pulang</p>
              <p className={`text-sm font-black ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{clockOutTime || '-- : --'}</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`p-2.5 rounded-xl relative ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <MapPin size={20} className={isDarkMode ? 'text-blue-400' : 'text-[#004691]'} />
              {isFetchingLocation && (
                <RefreshCw size={10} className="absolute -top-1 -right-1 text-blue-500 animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gray-500 font-black uppercase flex justify-between items-center tracking-wider">
                <span>Lokasi Terkini</span>
                {coords && ( <span className="text-[8px] opacity-40 font-mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span> )}
              </p>
              <p className={`text-xs font-bold truncate leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {locationName}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <LeaveMenuButton isDarkMode={isDarkMode} onClick={() => setActiveModal('izin')} icon={<FileText size={22} className="text-orange-500" />} label="Izin" />
          <LeaveMenuButton isDarkMode={isDarkMode} onClick={() => setActiveModal('sakit')} icon={<Stethoscope size={22} className="text-blue-500" />} label="Sakit" />
          <LeaveMenuButton isDarkMode={isDarkMode} onClick={() => setActiveModal('cuti')} icon={<CalendarOff size={22} className="text-purple-500" />} label="Cuti" />
        </div>

        <div className="space-y-4 pt-2 pb-12">
           <div className="flex justify-between items-center px-1">
              <h3 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat Presensi</h3>
              {attendanceHistory.length > 0 && (
                <button className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-[#004691]'}`}>Lihat Semua</button>
              )}
           </div>
           
           <div className={`rounded-2xl divide-y shadow-sm border transition-colors overflow-hidden ${
              isDarkMode ? 'bg-[#1e293b] divide-[#334155] border-[#334155]' : 'bg-white divide-gray-50 border-gray-100'
           }`}>
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((log) => (
                  <AttendanceLogItem key={log.id} isDarkMode={isDarkMode} date={log.date} time={log.time} status={log.status} location={log.location} />
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6 gap-4">
                  <div className={`p-6 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <ClipboardList size={48} className="text-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum Ada Riwayat</p>
                    <p className="text-xs text-gray-400">Log kehadiran harian Anda akan muncul di sini.</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className={`w-full max-w-[320px] rounded-[2rem] shadow-2xl p-5 transition-all transform animate-pop-in ${isDarkMode ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${
                  activeModal === 'izin' ? 'bg-orange-500/10' :
                  activeModal === 'sakit' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                }`}>
                  {activeModal === 'izin' && <FileText size={18} className="text-orange-500"/>}
                  {activeModal === 'sakit' && <Stethoscope size={18} className="text-blue-500"/>}
                  {activeModal === 'cuti' && <CalendarOff size={18} className="text-purple-500"/>}
                </div>
                <h3 className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Pengajuan {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
                </h3>
              </div>
              <button onClick={() => setActiveModal('none')} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><X size={16} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={(e) => handleModalSubmit(e, 'Izin - Half Day')} className="space-y-4">
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
              
              <button type="submit" disabled={modalLoading} className={`w-full mt-2 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${
                activeModal === 'izin' ? 'bg-orange-500' : activeModal === 'sakit' ? 'bg-blue-500' : 'bg-purple-500'
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
};

const LeaveMenuButton: React.FC<{isDarkMode: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({ isDarkMode, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border transition-all active:scale-90 shadow-sm ${
    isDarkMode ? 'bg-[#1e293b] border-[#334155] shadow-black/20' : 'bg-white border-gray-100 shadow-blue-900/5'
  }`}>
    <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
  </button>
);

const AttendanceLogItem: React.FC<{isDarkMode: boolean, date: string, time: string, status: string, location: string}> = ({isDarkMode, date, time, status, location}) => {
  const getIcon = () => {
    if (status.includes('Hadir') || status.includes('Terlambat')) return { icon: <CheckCircle2 size={20} className="text-green-500" />, bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-50'};
    if (status.includes('Izin')) return { icon: <FileText size={20} className="text-orange-500" />, bg: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'};
    if (status.includes('Sakit')) return { icon: <Stethoscope size={20} className="text-blue-500" />, bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'};
    return { icon: <AlertCircle size={20} className="text-gray-500" />, bg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100'};
  };
  const { icon, bg } = getIcon();

  return (
    <div className="p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
        <div>
          <p className={`font-bold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{status}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{date} • {location}</p>
        </div>
      </div>
      <p className={`font-black text-sm ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>{time}</p>
    </div>
  );
};


export default Attendance;

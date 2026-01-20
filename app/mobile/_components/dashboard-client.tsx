
'use client'

import React, { useState, useEffect } from 'react';
import {
  Sun, Moon, Bell, LogOut, Calendar, MapPin,
  UserCheck, ShieldCheck, BarChart3, Megaphone, ShieldAlert,
  Users, Search, TrendingUp, Landmark
} from 'lucide-react';
import Link from 'next/link';
import { logout } from './actions';
import { useTheme } from './theme-provider';
import type { Tables } from '@/lib/types/supabase';

type Profile = Tables<'profiles'>;

export default function DashboardClient({
  profile,
  stats,
  activities
}: {
  profile: Profile;
  stats: any;
  activities: any[];
}) {
  const { isDarkMode, toggleTheme } = useTheme();
  const [time, setTime] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [formattedDate, setFormattedDate] = useState('');
  const [motivationText, setMotivationText] = useState('');
  const [locationName, setLocationName] = useState('Mendeteksi lokasi...');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        hours: now.getHours().toString().padStart(2, '0'),
        minutes: now.getMinutes().toString().padStart(2, '0'),
        seconds: now.getSeconds().toString().padStart(2, '0'),
      });
      setFormattedDate(new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now));
      const greeting = ["Selamat Pagi 😊", "Selamat Siang ✨", "Selamat Sore 🌟", "Selamat Malam 🌙"][Math.floor(now.getHours() / 6)];
      setMotivationText(`${greeting} ++ Tetap semangat dan jangan pernah menyerah. ++ Setiap hari adalah kesempatan baru.`);
    };

    updateTime();
    const timerId = setInterval(updateTime, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`,
              { headers: { 'User-Agent': 'DimproNSV-App' } }
            );
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
              const street = addr.road || addr.pedestrian || addr.street;
              formattedName = street ? `${placeName}, ${street}` : placeName;
            } else {
              const road = addr.road || addr.pedestrian || addr.street;
              if (road) {
                formattedName = `${road}${addr.house_number ? ' No. ' + addr.house_number : ''}`;
              } else {
                formattedName = data.display_name.split(',').slice(0, 2).join(',');
              }
            }
            setLocationName(formattedName || "Lokasi tidak dikenal");
          } catch (error) {
            console.error("Error fetching location name", error);
            setLocationName("Gagal mengambil nama lokasi");
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setLocationName("Izin lokasi ditolak");
        }
      );
    } else {
      setLocationName("Geolocation tidak didukung");
    }
  }, []);

  const formatActivityTime = (ts: string) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Absensi': return { icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-50' };
      case 'Slik': return { icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />, bg: isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50' };
      case 'Laporan': return { icon: <BarChart3 className="w-5 h-5 text-yellow-600" />, bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50' };
      default: return { icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-50' };
    }
  }

  return (
    <div className={`min-h-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
      <div className={`px-6 pt-12 pb-6 relative overflow-hidden transition-colors duration-500 flex justify-between items-center rounded-b-[2.5rem] ${isDarkMode ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-white' : 'bg-white shadow-sm border-b border-gray-100'}`}>
        <div className={`absolute -top-4 -right-4 w-32 h-32 rounded-full blur-2xl ${isDarkMode ? 'bg-white/5' : 'bg-blue-500/5'}`}></div>
        <div className="flex items-center gap-4 z-10 min-w-0 pr-2">
          <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-md bg-gray-500 shrink-0">
            <img src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}&background=0D8ABC&color=fff`} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-light ${isDarkMode ? 'text-blue-200' : 'text-gray-500'}`}>Welcome Back,</p>
            <h1 className={`font-black text-xl leading-tight tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-[#004691]'}`}>{profile.full_name.split('@')[0]}</h1>
            <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-blue-200/80' : 'text-gray-400'}`}>{profile.job_title}</p>
          </div>
        </div>
        <div className="flex gap-2 z-10 shrink-0">
          <button onClick={toggleTheme} className={`p-2.5 rounded-lg backdrop-blur-md active:scale-90 transition-transform border ${isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={`p-2.5 rounded-lg backdrop-blur-md relative active:scale-90 transition-transform border ${isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <form action={logout}>
            <button type="submit" className={`p-2.5 rounded-lg backdrop-blur-md active:scale-90 transition-transform flex items-center justify-center border ${isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-gray-50 text-red-500 border-gray-100 hover:bg-gray-100'}`}>
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="px-6 pt-8 pb-32">
        <div className={`p-4 rounded-3xl shadow-lg transition-colors border ${isDarkMode ? 'bg-[#1e293b] text-white border-white/10' : 'bg-white text-gray-800 border-gray-100 shadow-blue-900/5'}`}>
          <div className="flex items-baseline mb-3 overflow-hidden whitespace-nowrap">
            <h2 className={`font-bold text-lg shrink-0 max-w-[40%] truncate ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>{`Hello, ${profile.full_name.split('@')[0].split(' ')[0]}`}</h2>
            <div className={`relative flex overflow-x-hidden text-sm ml-2 w-full min-w-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="animate-marquee whitespace-nowrap"><span className="mx-4">{motivationText}</span></div>
              <div className="animate-marquee absolute top-0 whitespace-nowrap"><span className="mx-4">{motivationText}</span></div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-center my-3">
            {[time.hours, time.minutes, time.seconds].map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-4xl font-bold pb-8 text-blue-400">:</span>}
                <div className="flex flex-col items-center">
                  <div className={`rounded-xl p-2.5 min-w-[60px] md:min-w-[80px] flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-black/20' : 'bg-gray-100'}`}>
                    <span className={`text-5xl font-black font-mono tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#004691]'}`}>{t}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 uppercase font-bold tracking-wider">
                    {['Hours', 'Minute', 'Second'][i]}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className={`border-t my-3 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}></div>

          <div className="flex justify-between items-center text-xs font-bold">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-red-500" />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 max-w-[50%]">
              <MapPin size={16} className="text-red-500 flex-shrink-0" />
              <span className={`truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{locationName}</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-4 gap-y-6 mt-8">
          {[
            { href: "/mobile/attendance", icon: UserCheck, color: "text-red-500", label: "Absensi" },
            { href: "/mobile/sliks", icon: ShieldAlert, color: "text-indigo-500", label: "SLIKs" },
            { href: "/mobile/reports/leads", icon: BarChart3, color: "text-yellow-600", label: "Laporan" },
            { href: "/mobile/reports/ads", icon: Megaphone, color: "text-cyan-500", label: "Reports Ads" },
          ].map((item, idx) => (
            <Link key={idx} href={item.href} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-active:scale-90 transition-all border ${isDarkMode ? 'bg-white/5 border-white/10 group-hover:bg-white/10' : 'bg-white border-gray-100 group-hover:bg-gray-50'}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Kinerja */}
        <div className="space-y-4 mt-8">
          <h3 className={`font-bold px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Ringkasan Akun & Kinerja</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, color: "text-blue-500", label: "Total Leads", value: stats.totalLeads, sub: "Bulan Ini" },
              { icon: Search, color: "text-yellow-500", label: "Total Sliks", value: stats.totalSliks, sub: "Bulan Ini" },
              { icon: TrendingUp, color: "text-green-500", label: "Peningkatan Penjualan", value: stats.peningkatanPenjualan, sub: "+12% target" },
              { icon: Landmark, color: "text-indigo-500", label: "Total BAST", value: stats.totalBAST, sub: "Terverifikasi" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-3xl border transition-all shadow-sm ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-[11px] font-bold leading-tight text-gray-400">{stat.label}</p>
                </div>
                <p className={`text-lg font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-[#004691]'}`}>{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-gray-500">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="space-y-4 mt-8">
          <div className="flex justify-between items-center px-1">
            <h3 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Aktivitas Terakhir</h3>
            <Link href="/mobile/history" className="text-xs font-black uppercase tracking-widest text-blue-400">Lihat Semua</Link>
          </div>
          <div className={`rounded-[2.2rem] overflow-hidden shadow-sm border transition-all ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
            <div className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-50'}`}>
              {activities.map(activity => (
                <div key={activity.id} className="p-4 flex justify-between items-center active:bg-gray-500/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${getActivityIcon(activity.type).bg}`}>
                      {getActivityIcon(activity.type).icon}
                    </div>
                    <div className="flex flex-col">
                      <p className={`font-bold text-sm leading-none ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{activity.title}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 leading-none">{activity.status}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-sm leading-none ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>{formatActivityTime(activity.timestamp)}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase mt-0.5 leading-none">{activity.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

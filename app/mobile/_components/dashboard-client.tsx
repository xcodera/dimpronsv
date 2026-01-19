
'use client'

import { useState, useEffect } from 'react';
import { Sun, Moon, Bell, LogOut, Calendar, MapPin } from 'lucide-react';
import { logout } from './actions';
import type { Tables } from '@/lib/types/supabase';

type Profile = Tables<'profiles'>;

export default function DashboardClient({ profile }: { profile: Profile }) {
  const [time, setTime] = useState({
    hours: '00',
    minutes: '00',
    seconds: '00'
  });
  const [formattedDate, setFormattedDate] = useState('');
  const [motivationText, setMotivationText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); // Always dark
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
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`,
              {
                headers: {
                  'User-Agent': 'DimproNSV-App'
                }
              }
            );
            const data = await response.json();
            const address = data.address;
            const location = `${address.suburb || address.village || address.town || ''}, ${address.state || ''}`;
            setLocationName(location.startsWith(',') ? location.substring(2) : location || data.display_name.split(',').slice(0, 2).join(', '));
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

  return (
    <>
      <div className="px-6 pt-12 pb-6 relative overflow-hidden transition-colors duration-500 flex justify-between items-center rounded-b-[2.5rem] bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-white">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4 z-10 min-w-0 pr-2">
          <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-md bg-gray-500 shrink-0">
            <img src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}&background=0D8ABC&color=fff`} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-light text-blue-200">Welcome Back,</p>
            <h1 className="text-white font-black text-xl leading-tight tracking-tight truncate">{profile.full_name.split('@')[0]}</h1>
            <p className="text-xs text-blue-200/80 mt-0.5 truncate">{profile.job_title}</p>
          </div>
        </div>
        <div className="flex gap-2 z-10 shrink-0">
          <button onClick={() => alert("Dark mode is default")} className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/10 active:scale-90 transition-transform">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/10 relative active:scale-90 transition-transform">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <form action={logout}>
            <button type="submit" className="p-2.5 rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/10 active:scale-90 transition-transform flex items-center justify-center">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="px-6 pt-8">
        <div className="p-4 rounded-3xl shadow-lg transition-colors bg-[#1e293b] text-white border border-white/10">
          <div className="flex items-baseline mb-3 overflow-hidden whitespace-nowrap">
            <h2 className="font-bold text-lg shrink-0 text-gray-200 max-w-[40%] truncate">{`Hello, ${profile.full_name.split('@')[0].split(' ')[0]}`}</h2>
            <div className="relative flex overflow-x-hidden text-sm text-gray-500 ml-2 w-full min-w-0">
              <div className="animate-marquee whitespace-nowrap"><span className="mx-4">{motivationText}</span></div>
              <div className="animate-marquee absolute top-0 whitespace-nowrap"><span className="mx-4">{motivationText}</span></div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-center my-3">
            <div className="flex flex-col items-center">
              <div className="rounded-xl p-2.5 min-w-[60px] md:min-w-[80px] flex items-center justify-center shadow-inner bg-black/20"><span className="text-5xl font-black font-mono tracking-tighter text-white">{time.hours}</span></div><p className="text-xs text-gray-500 mt-2 uppercase font-bold tracking-wider">Hours</p>
            </div>
            <span className="text-4xl font-bold pb-8 text-blue-400">:</span>
            <div className="flex flex-col items-center">
              <div className="rounded-xl p-2.5 min-w-[60px] md:min-w-[80px] flex items-center justify-center shadow-inner bg-black/20"><span className="text-5xl font-black font-mono tracking-tighter text-white">{time.minutes}</span></div><p className="text-xs text-gray-500 mt-2 uppercase font-bold tracking-wider">Minute</p>
            </div>
            <span className="text-4xl font-bold pb-8 text-blue-400">:</span>
            <div className="flex flex-col items-center">
              <div className="rounded-xl p-2.5 min-w-[60px] md:min-w-[80px] flex items-center justify-center shadow-inner bg-black/20"><span className="text-5xl font-black font-mono tracking-tighter text-white">{time.seconds}</span></div><p className="text-xs text-gray-500 mt-2 uppercase font-bold tracking-wider">Second</p>
            </div>
          </div>

          <div className="border-t my-3 border-white/10"></div>

          <div className="flex justify-between items-center text-xs font-bold">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-red-500" />
              <span className="text-gray-300">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 max-w-[50%]">
              <MapPin size={16} className="text-red-500 flex-shrink-0" />
              <span className="truncate text-gray-300">{locationName}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

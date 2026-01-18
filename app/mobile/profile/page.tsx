
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, ShieldCheck, MapPin, Settings, Info, LogOut, ChevronRight } from "lucide-react";
import { logout } from "../_components/actions";

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (!profile) {
        redirect('/login');
    }

    return (
        <div className="flex flex-col h-full">
            <div className="bg-[#1e293b] border-[#334155] px-6 py-10 flex flex-col items-center shadow-sm">
                <div className="w-28 h-28 rounded-full mb-4 border-4 overflow-hidden border-blue-500/30">
                    <img src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}&background=0D8ABC&color=fff`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-black text-white">{profile.full_name}</h2>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 text-blue-400">{profile.job_title}</p>
            </div>
            
            <div className="p-6 space-y-3 text-white">
                <button className="w-full flex justify-between items-center p-4 rounded-2xl transition-colors font-bold hover:bg-white/5 text-gray-200">
                    <div className="flex items-center gap-4"><User className="w-5 h-5" /><span>Informasi Pribadi</span></div>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex justify-between items-center p-4 rounded-2xl transition-colors font-bold hover:bg-white/5 text-gray-200">
                    <div className="flex items-center gap-4"><ShieldCheck className="w-5 h-5" /><span>Keamanan</span></div>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex justify-between items-center p-4 rounded-2xl transition-colors font-bold hover:bg-white/5 text-gray-200">
                    <div className="flex items-center gap-4"><MapPin className="w-5 h-5" /><span>Alamat Tersimpan</span></div>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <div className="pt-2"></div>
                <button className="w-full flex justify-between items-center p-4 rounded-2xl transition-colors font-bold hover:bg-white/5 text-gray-200">
                    <div className="flex items-center gap-4"><Settings className="w-5 h-5" /><span>Pengaturan Aplikasi</span></div>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex justify-between items-center p-4 rounded-2xl transition-colors font-bold hover:bg-white/5 text-gray-200">
                    <div className="flex items-center gap-4"><Info className="w-5 h-5" /><span>Bantuan</span></div>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <div className="pt-2"></div>
                <form action={logout}>
                    <button type="submit" className="w-full flex justify-between items-center p-4 rounded-2xl transition-colors text-red-500 font-bold hover:bg-red-500/10">
                        <div className="flex items-center gap-4"><LogOut className="w-5 h-5" /><span>Keluar</span></div>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

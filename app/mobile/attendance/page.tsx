
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendanceClient from "./_components/attendance-client";
import type { Tables } from "@/lib/types/supabase";

export default async function AttendancePage() {
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

    const today = new Date().toISOString().split('T')[0];
    const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('profile_id', user.id)
        .eq('attendance_date', today)
        .maybeSingle();

    const { data: history } = await supabase
        .from('attendance')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    return <AttendanceClient 
        profile={profile} 
        todayAttendance={todayAttendance as Tables<'attendance'> | null}
        history={history as Tables<'attendance'>[]} 
    />;
}

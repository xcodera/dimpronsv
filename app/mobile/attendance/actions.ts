
'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function clockIn(latitude: number, longitude: number, locationName: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const now = new Date();
    const clockInTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    // Determine status (late or present)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const status = isLate ? 'late' : 'present';

    const { data, error } = await supabase
        .from('attendance')
        .insert({
            profile_id: user.id,
            clock_in: clockInTime,
            status: status,
            latitude: latitude,
            longitude: longitude,
            location_name: locationName,
        })
        .select()
        .single();

    if (error) {
        console.error('Clock-in error:', error);
        return { success: false, error: 'Failed to clock in.' };
    }
    
    revalidatePath('/mobile/attendance');
    return { success: true, data };
}

export async function clockOut(attendanceId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const clockOutTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const { data, error } = await supabase
        .from('attendance')
        .update({ clock_out: clockOutTime })
        .eq('attendance_id', attendanceId)
        .eq('profile_id', user.id)
        .select()
        .single();
    
    if (error) {
        console.error('Clock-out error:', error);
        return { success: false, error: 'Failed to clock out.' };
    }
    
    revalidatePath('/mobile/attendance');
    return { success: true, data };
}


export async function submitLeave(status: string, notes: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const permissionType = status.includes('Half') ? 'halfday' : status.includes('Full') ? 'fullday' : 'none';
    const dbStatus = status.includes('Izin') ? 'permission' : status.toLowerCase();

    const { data, error } = await supabase
        .from('attendance')
        .insert({
            profile_id: user.id,
            status: dbStatus,
            permission_type: permissionType,
            notes: notes,
        })
        .select()
        .single();
    
    if (error) {
        console.error('Leave submission error:', error);
        return { success: false, error: 'Failed to submit leave request.' };
    }
    
    revalidatePath('/mobile/attendance');
    return { success: true, data };
}

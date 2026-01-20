
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
    const clockInTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const attendanceDate = now.toISOString().split('T')[0];

    // Determine status (late or present)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const status = isLate ? 'late' : 'present';

    // Check if exists
    const { data: existing } = await supabase
        .from('attendance')
        .select('attendance_id')
        .eq('profile_id', user.id)
        .eq('attendance_date', attendanceDate)
        .maybeSingle();

    let result;

    if (existing) {
        // Update
        result = await supabase
            .from('attendance')
            .update({
                clock_in: clockInTime,
                status: status,
                latitude: latitude,
                longitude: longitude,
                location_name: locationName,
            })
            .eq('attendance_id', existing.attendance_id)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from('attendance')
            .insert({
                profile_id: user.id,
                attendance_date: attendanceDate,
                clock_in: clockInTime,
                status: status,
                latitude: latitude,
                longitude: longitude,
                location_name: locationName,
            })
            .select()
            .single();
    }

    if (result.error) {
        console.error('Clock-in error:', result.error);
        return { success: false, error: `Failed to clock in: ${result.error.message}` };
    }

    revalidatePath('/mobile/attendance');
    return { success: true, data: result.data };
}

export async function clockOut(attendanceId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const clockOutTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const { data, error } = await supabase
        .from('attendance')
        .update({ clock_out: clockOutTime })
        .eq('attendance_id', attendanceId)
        .eq('profile_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Clock-out error:', error);
        return { success: false, error: `Failed to clock out: ${error.message}` };
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
            attendance_date: new Date().toISOString().split('T')[0],
            status: dbStatus,
            permission_type: permissionType,
            notes: notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Leave submission error:', error);
        return { success: false, error: `Failed to submit leave request: ${error.message}` };
    }

    revalidatePath('/mobile/attendance');
    return { success: true, data };
}

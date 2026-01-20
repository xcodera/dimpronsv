'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReportFormData = {
    report_date: string;
    total_leads: number;
    call_count: number;
    slik_count: number;
    visit_count: number;
    notes: string;
    // extras to be appended to notes as they are missing in DB
    follow_up?: number;
    berkas_masuk?: number;
};

export async function createReport(data: ReportFormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Append extra fields to notes if present
    let finalNotes = data.notes || "";
    if (data.follow_up !== undefined && data.follow_up > 0) finalNotes += `\n[Follow Up: ${data.follow_up}]`;
    if (data.berkas_masuk !== undefined && data.berkas_masuk > 0) finalNotes += `\n[Berkas Masuk: ${data.berkas_masuk}]`;

    const { error } = await supabase
        .from("report_leads")
        .insert({
            profile_id: user.id,
            report_date: data.report_date,
            total_leads: data.total_leads,
            call_count: data.call_count,
            slik_count: data.slik_count,
            visit_count: data.visit_count,
            notes: finalNotes.trim(),
        });

    if (error) {
        console.error("Error creating report:", error);
        throw new Error("Failed to create report");
    }

    revalidatePath("/mobile/reports/leads");
    revalidatePath("/mobile");
    return { success: true };
}

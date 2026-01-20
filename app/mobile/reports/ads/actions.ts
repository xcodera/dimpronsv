'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AdReportFormData = {
    report_date: string;
    platform: string;
    campaign_name: string;
    total_spend: number;
    leads_count: number;
    budget_set: string; // Not in DB, stored in AI summary or ignored if not needed
    keterangan: string; // Stored in ai_summary for now as per plan
};

export async function createAdReport(data: AdReportFormData & { marketing_id?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Calculate CPR (Cost Per Result/Lead)
    const cpr = data.leads_count > 0 ? data.total_spend / data.leads_count : 0;
    const ctr = 0; // Placeholder

    // Combine Budget Set and Keterangan into ai_summary for storage
    // "Budget Set: X | Note: Y"
    const ai_summary = `Budget Set: ${data.budget_set} | Note: ${data.keterangan}`;

    const { error } = await supabase
        .from("report_ads")
        .insert({
            marketing_id: data.marketing_id || user.id, // Use provided marketing_id or current user
            report_date: data.report_date,
            platform: data.platform as "Facebook" | "Google" | "TikTok" | "Instagram",
            campaign_name: data.campaign_name,
            total_spend: data.total_spend,
            leads_count: data.leads_count,
            cpr: cpr,
            ctr: ctr,
            ai_summary: ai_summary
        });

    if (error) {
        console.error("Error creating ad report:", error);
        throw new Error("Failed to create ad report");
    }

    revalidatePath("/mobile/reports/ads");
    revalidatePath("/mobile");
    return { success: true };
}

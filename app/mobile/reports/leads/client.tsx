'use client';

import React, { useState } from 'react';
import {
    History, Calendar, Users, Phone, ShieldCheck,
    FileStack, MessageSquare, Send, RefreshCw, CheckCircle2,
    BarChart3, MapPin
} from 'lucide-react';
import { createReport } from './actions';
import { Tables } from '@/lib/types/supabase';

interface ReportsClientProps {
    initialReports: Tables<'report_leads'>[];
    userName: string;
}

interface ReportFormData {
    report_date: string;
    total_leads: string;
    follow_up: string;
    calls: string;
    slik: string;
    berkas_masuk: string;
    visit_count: string;
    notes: string;
}

const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
};

const FormField: React.FC<{
    label: string;
    subLabel?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    name: keyof ReportFormData;
    type?: string;
    placeholder?: string;
    as?: 'input' | 'textarea';
    icon: React.ReactNode;
}> = ({ label, subLabel, value, onChange, name, type = 'text', placeholder, as = 'input', icon }) => {
    const InputComponent = as;
    // Using fixed dark mode/style as per app theme
    const isDarkMode = true;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor={name} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    {icon}
                </div>
                <InputComponent
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder || subLabel}
                    required={name !== 'notes'}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm font-semibold focus:outline-none transition-all ${isDarkMode
                            ? 'bg-[#1e293b] border-[#334155] text-white placeholder:text-gray-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-100 text-gray-800 placeholder:text-gray-400 focus:border-[#004691]'
                        }`}
                    {...(as === 'textarea' ? { rows: 3 } : {})}
                />
            </div>
        </div>
    );
};

export default function ReportsClient({ initialReports, userName }: ReportsClientProps) {
    const [formData, setFormData] = useState<ReportFormData>({
        report_date: getYesterday(),
        total_leads: '',
        follow_up: '',
        calls: '',
        slik: '',
        berkas_masuk: '',
        visit_count: '',
        notes: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await createReport({
                report_date: formData.report_date,
                total_leads: parseInt(formData.total_leads) || 0,
                call_count: parseInt(formData.calls) || 0,
                slik_count: parseInt(formData.slik) || 0,
                visit_count: parseInt(formData.visit_count) || 0,
                notes: formData.notes,
                follow_up: parseInt(formData.follow_up) || 0,
                berkas_masuk: parseInt(formData.berkas_masuk) || 0
            });

            // --- WHATSAPP INTEGRATION ---
            const reportDate = new Date(formData.report_date + 'T00:00:00');
            const formattedDate = reportDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const message =
                `*Laporan Harian Marketing*

${formattedDate}
*${userName}*

Total Respon : ${formData.total_leads || 0}
Total Follow UP : ${formData.follow_up || 0}
Total Call : ${formData.calls || 0}
Total Slik : ${formData.slik || 0}
Berkas Masuk : ${formData.berkas_masuk || 0}
Total Ceklok : ${formData.visit_count || 0}
Keterangan : ${formData.notes || '-'}`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
            // --- END WHATSAPP INTEGRATION ---

            setFormData({
                report_date: getYesterday(),
                total_leads: '',
                follow_up: '',
                calls: '',
                slik: '',
                berkas_masuk: '',
                visit_count: '',
                notes: '',
            });

        } catch (error) {
            console.error(error);
            alert("Gagal mengirim laporan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const isDarkMode = true; // Forcing dark mode consistent with mobile dashboard

    return (
        <div className={`flex flex-col h-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
            <div className={`px-6 py-4 flex justify-between items-center sticky top-0 z-10 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white border-b border-gray-100'}`}>
                {/* Navigation is handled by layout/back button if needed, or we can add a Back Link */}
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-[#004691]'}`}>Buat Laporan Harian</h2>
                <a href="#history" className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-[#004691]'}`}>
                    <History size={20} />
                </a>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-8">
                <form onSubmit={handleSubmit} className={`p-6 rounded-3xl border space-y-4 shadow-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100'}`}>
                    <FormField label="Tanggal Laporan" type="date" name="report_date" value={formData.report_date} onChange={handleInputChange} icon={<Calendar size={16} />} />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Total Leads" subLabel="Total leads kemarin" type="number" name="total_leads" value={formData.total_leads} onChange={handleInputChange} icon={<Users size={16} />} />
                        <FormField label="Follow Up" subLabel="Total follow up" type="number" name="follow_up" value={formData.follow_up} onChange={handleInputChange} icon={<Phone size={16} />} />
                        <FormField label="Calls" subLabel="Total panggilan" type="number" name="calls" value={formData.calls} onChange={handleInputChange} icon={<Phone size={16} />} />
                        <FormField label="SLIK" subLabel="Total SLIK dikirim" type="number" name="slik" value={formData.slik} onChange={handleInputChange} icon={<ShieldCheck size={16} />} />
                        <FormField label="Berkas Masuk" subLabel="Jumlah berkas" type="number" name="berkas_masuk" value={formData.berkas_masuk} onChange={handleInputChange} icon={<FileStack size={16} />} />
                        <FormField label="Total Visit" subLabel="Cantidad visitas" type="number" name="visit_count" value={formData.visit_count} onChange={handleInputChange} icon={<MapPin size={16} />} />
                    </div>

                    <FormField label="Keterangan" as="textarea" name="notes" value={formData.notes} onChange={handleInputChange} icon={<MessageSquare size={16} />} />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full mt-4 py-4 rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 ${isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/30' : 'bg-[#004691] text-white shadow-[#004691]/20'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>MENGIRIM...</span>
                            </>
                        ) : (
                            <>
                                <span>KIRIM LAPORAN</span>
                                <Send size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div id="history" className="space-y-4 pt-4 pb-12">
                    <h3 className={`font-bold text-sm px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat Laporan Terkirim</h3>
                    <div className={`rounded-2xl divide-y shadow-sm border transition-colors ${isDarkMode ? 'bg-[#1e293b] divide-white/5 border-white/5' : 'bg-gray-50 divide-gray-100 border-gray-100'
                        }`}>
                        {initialReports.length > 0 ? (
                            initialReports.map(log => (
                                <div key={log.report_id} className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                                                <BarChart3 size={18} className="text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    Laporan {new Date(log.report_date || log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Leads: {log.total_leads} | SLIK: {log.slik_count}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-500">
                                            <CheckCircle2 size={12} />
                                            <span className="text-[10px] font-bold">Terkirim</span>
                                        </div>
                                    </div>
                                    {log.notes && (
                                        <p className={`text-xs mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                            {log.notes}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-6 gap-3 text-gray-400">
                                <BarChart3 size={32} className="opacity-20" />
                                <p className="text-xs font-bold">Belum ada laporan yang dikirim sesi ini.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

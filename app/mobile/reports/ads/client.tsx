'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronLeft, Calendar, UserPlus, Send, RefreshCw,
    PlusCircle, Trash2, X, Target, BarChart, CheckCircle2,
    Users, Megaphone
} from 'lucide-react';
import { createAdReport } from './actions';
import { Tables } from '@/lib/types/supabase';

interface AdsReportsClientProps {
    initialReports: any[];
    marketers: { id: string, full_name: string, role: string }[];
    userName: string;
}

// Interface matches prototype exactly (+ hidden fields for DB)
interface AdReportFormData {
    budgetSet: string;
    spentBudget: string;
    leads: string;
    keterangan: string;
}

// Interface for the list of added reports to be sent
interface QueuedReport extends AdReportFormData {
    marketerId: string;
    marketerName: string;
    id: string; // unique ID for React keys
}

const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
};

const formatInputAsIDRCurrency = (value: string): string => {
    if (!value) return '';
    const numericString = value.replace(/[^0-9]/g, '');
    if (numericString === '') return '';
    const number = parseInt(numericString, 10);
    if (isNaN(number)) return '';
    return number.toLocaleString('id-ID');
};

export default function AdsReportsClient({ initialReports = [], marketers = [], userName }: AdsReportsClientProps) {
    const [reportDate, setReportDate] = useState(getYesterday());
    const [queuedReports, setQueuedReports] = useState<QueuedReport[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedMarketer, setSelectedMarketer] = useState<{ id: string, name: string } | null>(null);

    const [modalFormData, setModalFormData] = useState<AdReportFormData>({
        budgetSet: '', spentBudget: '', leads: '', keterangan: ''
    });

    const [isSending, setIsSending] = useState(false);

    // Filter history by selected date
    const historyForDate = useMemo(() => {
        return initialReports.filter(r => r.report_date === reportDate);
    }, [initialReports, reportDate]);

    const openModalFor = (marketer: { id: string, full_name: string }) => {
        setSelectedMarketer({ id: marketer.id, name: marketer.full_name });

        // Check if report already exists for this marketer in queue
        const existingReport = queuedReports.find(r => r.marketerId === marketer.id);

        if (existingReport) {
            setModalFormData({
                budgetSet: existingReport.budgetSet,
                spentBudget: existingReport.spentBudget,
                leads: existingReport.leads,
                keterangan: existingReport.keterangan
            });
        } else {
            setModalFormData({ budgetSet: '', spentBudget: '', leads: '', keterangan: '' });
        }

        setIsModalOpen(true);
    };

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'budgetSet' || name === 'spentBudget') {
            setModalFormData(prev => ({ ...prev, [name]: formatInputAsIDRCurrency(value) }));
        } else {
            setModalFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMarketer) return;

        // Remove existing if present (to update)
        const others = queuedReports.filter(r => r.marketerId !== selectedMarketer.id);

        const newReport: QueuedReport = {
            ...modalFormData,
            marketerId: selectedMarketer.id,
            marketerName: selectedMarketer.name,
            id: Date.now().toString()
        };

        // Sort by name to keep list tidy? Or just append. Prototype sorts by localeCompare.
        const updated = [...others, newReport].sort((a, b) => a.marketerName.localeCompare(b.marketerName));

        setQueuedReports(updated);
        setIsModalOpen(false);
    };

    const removeQueuedReport = (id: string) => {
        setQueuedReports(prev => prev.filter(r => r.id !== id));
    };

    const handleSendReports = async () => {
        if (queuedReports.length === 0) return;
        setIsSending(true);

        try {
            await Promise.all(queuedReports.map(report => {
                const spent = Number((report.spentBudget || '0').replace(/\./g, ''));
                const leads = Number(report.leads || 0);

                return createAdReport({
                    report_date: reportDate,
                    platform: 'Facebook', // Defaulting to Facebook as per hidden logical requirement
                    campaign_name: 'Laporan Harian', // Default grouping name
                    total_spend: spent,
                    leads_count: leads,
                    budget_set: report.budgetSet,
                    keterangan: report.keterangan,
                    marketing_id: report.marketerId
                });
            }));

            // WA Integration - Matching Prototype Format
            const reportDateObj = new Date(reportDate + 'T00:00:00');
            const formattedDate = reportDateObj.toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            let message = `*Laporan Harian Iklan*\n\n${formattedDate}\n*${userName}*\n\n`;

            let totalSpent = 0;
            let totalLeads = 0;

            queuedReports.forEach(report => {
                const budgetSetValue = Number((report.budgetSet || '0').replace(/\./g, ''));
                const spent = Number((report.spentBudget || '0').replace(/\./g, ''));
                const leads = Number(report.leads || 0);
                const cpr = leads > 0 ? spent / leads : 0;

                totalSpent += spent;
                totalLeads += leads;

                message += `Marketing : ${report.marketerName}\n`;
                message += `Anggaran Harian : ${budgetSetValue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}\n`;
                message += `Penggunan : ${spent.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}\n`;
                message += `Database : ${leads}\n`;
                message += `Harga per Leads : ${cpr.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 })}\n`;
                message += `Keterangan : ${report.keterangan || '-'}\n`;
                message += `----------------------------\n`;
            });

            const averageCpr = totalLeads > 0 ? totalSpent / totalLeads : 0;

            message += `\n*Rekap Iklan ${formattedDate}*\n`;
            message += `Total Anggaran : ${totalSpent.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}\n`;
            message += `Total Leads : ${totalLeads}\n`;
            message += `Rata-Rata : ${averageCpr.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 })}\n`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');

            setQueuedReports([]);

        } catch (error) {
            console.error(error);
            alert("Gagal mengirim laporan. Coba lagi.");
        } finally {
            setIsSending(false);
        }
    };

    const formatCurrency = (value: string | number) => {
        const numValue = Number(value) || 0;
        return numValue.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }

    const ModalFormField: React.FC<{ name: keyof AdReportFormData, label: string, icon: React.ReactNode, type?: string, as?: 'input' | 'textarea' }> = ({ name, label, icon, type = "number", as = "input" }) => {
        const Component = as;
        return (
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">{label}</label>
                <div className="relative mt-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>
                    <Component
                        name={name}
                        type={type}
                        inputMode={name === 'budgetSet' || name === 'spentBudget' || name === 'leads' ? 'numeric' : 'text'}
                        value={modalFormData[name]}
                        onChange={handleModalInputChange}
                        placeholder={label}
                        required={name === 'spentBudget' || name === 'leads'}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 text-sm font-semibold focus:outline-none transition-all ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-gray-50 border-gray-100 text-gray-800 focus:border-[#004691]'}`}
                        {...(as === 'textarea' ? { rows: 2 } : {})}
                    />
                </div>
            </div>
        );
    }

    const isDarkMode = true;

    return (
        <div className={`flex flex-col h-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
            <div className={`px-6 py-4 flex justify-between items-center sticky top-0 z-10 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white border-b border-gray-100'}`}>
                {/* Back button logic handled by layout, but title here */}
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-[#004691]'}`}>Laporan Iklan Harian</h2>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">

                <div className={`p-4 rounded-3xl border space-y-2 ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100'}`}>
                    <label htmlFor="reportDate" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Tanggal Laporan</label>
                    <div className="relative">
                        <Calendar size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <input
                            id="reportDate"
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm font-semibold focus:outline-none transition-all ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-gray-50 border-gray-100 text-gray-800 focus:border-[#004691]'}`}
                        />
                    </div>
                </div>

                {/* --- MARKETER LIST --- */}
                <div className="space-y-3">
                    <h3 className={`font-bold text-sm px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Input Data Iklan</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {marketers.length > 0 ? marketers.map(marketer => {
                            const isQueued = queuedReports.some(r => r.marketerId === marketer.id);
                            return (
                                <button key={marketer.id} onClick={() => openModalFor(marketer)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${isDarkMode ? 'bg-[#1e293b] border-[#334155] hover:bg-white/5' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                                            <Users size={18} className="text-blue-500" />
                                        </div>
                                        <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{marketer.full_name}</span>
                                    </div>
                                    {isQueued ? <CheckCircle2 size={20} className="text-green-500" /> : <PlusCircle size={20} className={isDarkMode ? 'text-blue-400' : 'text-[#004691]'} />}
                                </button>
                            );
                        }) : (
                            <div className={`text-center p-4 rounded-xl border border-dashed ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                                <p className="text-xs">Tidak ada data marketer ditemukan.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- QUEUED LIST (RIWAYAT Sesi Ini) --- */}
                <div className="space-y-3">
                    <h3 className={`font-bold text-sm px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat</h3>
                    {queuedReports.length > 0 ? (
                        <div className={`p-4 rounded-2xl shadow-sm border space-y-4 ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
                            <div className="space-y-2">
                                {queuedReports.map(report => (
                                    <div key={report.id} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold text-white text-sm">{report.marketerName}</p>
                                            <p className="text-xs text-gray-400 mt-1">Spend: {report.spentBudget} | Leads: {report.leads}</p>
                                        </div>
                                        <button onClick={() => removeQueuedReport(report.id)} className="p-2 text-red-400 bg-red-900/20 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <p className={`text-[11px] font-semibold leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Marketers: <strong className="text-white">{queuedReports.length}</strong>
                                </p>
                                <button
                                    onClick={handleSendReports}
                                    disabled={isSending}
                                    className={`p-3 rounded-full transition-all active:scale-90 flex-shrink-0 ${isDarkMode ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-[#004691]'}`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`py-12 flex flex-col items-center justify-center text-center px-6 gap-3 rounded-2xl ${isDarkMode ? 'bg-[#1e293b]' : 'bg-gray-50 border'}`}>
                            <Megaphone size={32} className={`opacity-20 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                            <p className="text-xs font-bold text-gray-400">Belum ada laporan iklan yang diinput.</p>
                        </div>
                    )}
                </div>

                {/* --- HISTORY DB --- */}
                {historyForDate.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-white/5">
                        <h3 className={`font-bold text-sm px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat Tersimpan</h3>
                        <div className="space-y-4">
                            {historyForDate.map(report => (
                                <div key={report.report_ads_id} className={`p-4 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                {report.profiles?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <CheckCircle2 size={16} className="text-green-500" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center mt-3">
                                        <div className="bg-white/5 p-2 rounded-lg">
                                            <p className="text-[10px] text-gray-400 uppercase">Spend</p>
                                            <p className="font-bold text-xs text-white">{formatCurrency(report.total_spend)}</p>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-lg">
                                            <p className="text-[10px] text-gray-400 uppercase">Leads</p>
                                            <p className="font-bold text-xs text-white">{report.leads_count}</p>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-lg">
                                            <p className="text-[10px] text-gray-400 uppercase">CPR</p>
                                            <p className="font-bold text-xs text-white">{formatCurrency(report.cpr || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDarkMode ? 'bg-[#1e293b] border border-white/10' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Input: {selectedMarketer?.name}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-white/10"><X size={18} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveReport} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <ModalFormField name="budgetSet" label="Budget Set" icon={<span className="font-bold text-sm">Rp</span>} type="text" />
                                <ModalFormField name="spentBudget" label="Spent" icon={<span className="font-bold text-sm">Rp</span>} type="text" />
                                <div className="col-span-2">
                                    <ModalFormField name="leads" label="Leads" icon={<Target size={14} />} type="number" />
                                </div>
                                <div className="col-span-2">
                                    <ModalFormField name="keterangan" label="Keterangan" icon={<BarChart size={14} />} as="textarea" type="text" />
                                </div>
                            </div>
                            <button type="submit" className={`w-full mt-2 py-3 rounded-lg font-bold text-sm ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#004691] text-white'}`}>Simpan Laporan</button>
                        </form>
                    </div>
                </div>
            )}

            <div className={`p-4 border-t sticky bottom-0 z-20 ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100'}`}>
                <button
                    onClick={handleSendReports}
                    disabled={isSending || queuedReports.length === 0}
                    className={`w-full py-4 rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/30' : 'bg-[#004691] text-white shadow-[#004691]/20'}`}
                >
                    {isSending ? <><RefreshCw size={16} className="animate-spin" /> MENGIRIM...</> : <><Send size={16} /> KIRIM LAPORAN LENGKAP</>}
                </button>
            </div>
        </div>
    );
};

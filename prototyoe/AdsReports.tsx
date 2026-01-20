
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, Calendar, Megaphone, UserPlus, Send, RefreshCw,
  PlusCircle, Trash2, X, Target, BarChart, CheckCircle2
} from 'lucide-react';
import { AppView, Activity } from '../types';
import { UserProfile } from '../constants';

// Define interfaces for the report data
interface AdReportData {
  budgetSet: string;
  spentBudget: string;
  leads: string;
  keterangan: string;
}

interface MarketerAdReport extends AdReportData {
  marketer: string;
}

// Define props for the component
interface AdsReportsProps {
  isDarkMode: boolean;
  setActiveView: (view: AppView) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  currentUser: UserProfile;
}

// Helper to get yesterday's date string
const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Helper to format string input as IDR currency without symbol
const formatInputAsIDRCurrency = (value: string): string => {
    if (!value) return '';
    const numericString = value.replace(/[^0-9]/g, '');
    if (numericString === '') return '';
    const number = parseInt(numericString, 10);
    if (isNaN(number)) return '';
    return number.toLocaleString('id-ID');
};

// Available marketers
const MARKETERS = ['Fika', 'Mhyta', 'Nana'];

const AdsReports: React.FC<AdsReportsProps> = ({ isDarkMode, setActiveView, addActivity, currentUser }) => {
  const [reportDate, setReportDate] = useState(getYesterday());
  const [reports, setReports] = useState<MarketerAdReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<string | null>(null);
  const [modalFormData, setModalFormData] = useState<AdReportData>({
    budgetSet: '', spentBudget: '', leads: '', keterangan: ''
  });
  const [isSending, setIsSending] = useState(false);

  const openModalFor = (marketer: string) => {
    setSelectedMarketer(marketer);
    const existingReport = reports.find(r => r.marketer === marketer);
    setModalFormData(existingReport || { budgetSet: '', spentBudget: '', leads: '', keterangan: '' });
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

    const otherReports = reports.filter(r => r.marketer !== selectedMarketer);
    const newReport: MarketerAdReport = { ...modalFormData, marketer: selectedMarketer };
    
    setReports([...otherReports, newReport].sort((a, b) => a.marketer.localeCompare(b.marketer)));
    setIsModalOpen(false);
  };

  const handleSendToWhatsapp = () => {
    if (reports.length === 0) return;
    setIsSending(true);

    const reportDateObj = new Date(reportDate + 'T00:00:00');
    const formattedDate = reportDateObj.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    let message = `*Laporan Harian Iklan*\n\n${formattedDate}\n*${currentUser.name}*\n\n`;
    
    let totalSpent = 0;
    let totalLeads = 0;

    reports.forEach(report => {
      const budgetSetValue = Number((report.budgetSet || '0').replace(/\./g, ''));
      const spent = Number((report.spentBudget || '0').replace(/\./g, ''));
      const leads = Number(report.leads || 0);
      const cpr = leads > 0 ? spent / leads : 0;
      
      totalSpent += spent;
      totalLeads += leads;

      message += `Marketing : ${report.marketer}\n`;
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
    
    setTimeout(() => {
        setIsSending(false);
        addActivity({
            type: 'Report',
            title: 'Laporan Iklan Dikirim',
            status: `${reports.length} marketer reported`
        });
    }, 1000);
  };
  
  const formatCurrency = (value: string | number) => {
    const numValue = Number(value) || 0;
    return numValue.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        // Use 2 decimal places for floats (like CPR), and 0 for integers (like Budget/Spent)
        minimumFractionDigits: numValue % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
    });
  }

  const ModalFormField: React.FC<{name: keyof AdReportData, label: string, icon: React.ReactNode, type?: string, as?: 'input' | 'textarea'}> = ({ name, label, icon, type = "number", as = "input"}) => {
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
                    required={name !== 'keterangan'}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 text-sm font-semibold focus:outline-none transition-all ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-gray-50 border-gray-100 text-gray-800 focus:border-[#004691]'}`}
                    {...(as === 'textarea' ? { rows: 2 } : {})}
                />
            </div>
        </div>
      );
  }
  
  // Summary calculations
  const totalBudgetSet = useMemo(() => reports.reduce((sum, r) => sum + Number((r.budgetSet || '0').replace(/\./g, '')), 0), [reports]);
  const totalSpent = useMemo(() => reports.reduce((sum, r) => sum + Number((r.spentBudget || '0').replace(/\./g, '')), 0), [reports]);
  const totalLeads = useMemo(() => reports.reduce((sum, r) => sum + Number(r.leads || 0), 0), [reports]);
  const averageCpr = useMemo(() => (totalLeads > 0 ? totalSpent / totalLeads : 0), [totalLeads, totalSpent]);

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
      <div className={`px-6 py-4 flex justify-between items-center sticky top-0 z-10 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white border-b border-gray-100'}`}>
        <button onClick={() => setActiveView('home')} className={`p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-[#004691]'}`}>
          <ChevronLeft size={24} />
        </button>
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

        <div className="space-y-3">
          <h3 className={`font-bold text-sm px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Input Data Iklan</h3>
          <div className="grid grid-cols-1 gap-3">
            {MARKETERS.map(marketer => (
              <button key={marketer} onClick={() => openModalFor(marketer)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${isDarkMode ? 'bg-[#1e293b] border-[#334155] hover:bg-white/5' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                          <UserPlus size={18} className="text-blue-500" />
                      </div>
                      <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{marketer}</span>
                  </div>
                  {reports.some(r => r.marketer === marketer) ? <CheckCircle2 size={20} className="text-green-500"/> : <PlusCircle size={20} className={isDarkMode ? 'text-blue-400' : 'text-[#004691]'} />}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className={`font-bold text-sm px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat</h3>
          {reports.length > 0 ? (
            <div className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center gap-4 ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
              <div className="flex-1 space-y-1">
                <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {new Date(reportDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - {reports.length} Marketing
                </p>
                <p className={`text-[11px] font-semibold leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Budget: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{formatCurrency(totalBudgetSet)}</strong> - 
                  Spent: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{formatCurrency(totalSpent)}</strong> - 
                  Leads: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{totalLeads}</strong> - 
                  CPR: <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{formatCurrency(averageCpr)}</strong>
                </p>
              </div>
              <button
                onClick={handleSendToWhatsapp}
                className={`p-3 rounded-full transition-all active:scale-90 flex-shrink-0 ${isDarkMode ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-[#004691]'}`}
                aria-label="Kirim Ulang Laporan Lengkap"
              >
                <Send size={18} />
              </button>
            </div>
          ) : (
            <div className={`py-12 flex flex-col items-center justify-center text-center px-6 gap-3 rounded-2xl ${isDarkMode ? 'bg-[#1e293b]' : 'bg-gray-50 border'}`}>
              <Megaphone size={32} className={`opacity-20 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-xs font-bold text-gray-400">Belum ada laporan iklan yang diinput.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className={`p-4 border-t sticky bottom-0 z-20 ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-100'}`}>
        <button
            onClick={handleSendToWhatsapp}
            disabled={isSending || reports.length === 0}
            className={`w-full py-4 rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/30' : 'bg-[#004691] text-white shadow-[#004691]/20'}`}
        >
            {isSending ? <><RefreshCw size={16} className="animate-spin" /> MENGIRIM...</> : <><Send size={16} /> KIRIM LAPORAN LENGKAP</>}
        </button>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDarkMode ? 'bg-[#1e293b] border border-white/10' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Laporan untuk {selectedMarketer}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-white/10"><X size={18} className="text-gray-400"/></button>
                  </div>
                  <form onSubmit={handleSaveReport} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ModalFormField name="budgetSet" label="Budget Set" icon={<span className="font-bold text-sm">Rp</span>} type="text" />
                        <ModalFormField name="spentBudget" label="Spent" icon={<span className="font-bold text-sm">Rp</span>} type="text" />
                        <div className="col-span-2">
                          <ModalFormField name="leads" label="Leads" icon={<Target size={14}/>} type="number" />
                        </div>
                        <div className="col-span-2">
                         <ModalFormField name="keterangan" label="Keterangan" icon={<BarChart size={14}/>} as="textarea" type="text" />
                        </div>
                    </div>
                    <button type="submit" className={`w-full mt-2 py-3 rounded-lg font-bold text-sm ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#004691] text-white'}`}>Simpan Laporan</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdsReports;

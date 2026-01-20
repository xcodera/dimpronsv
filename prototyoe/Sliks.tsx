
import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, CreditCard, Camera, RefreshCw, 
  User, MapPin, Search, Database,
  CheckCircle2, Calendar, UserCircle, 
  Globe, Droplet, ChevronDown, X, Check,
  ClipboardPaste
} from 'lucide-react';
import { AppView, Activity } from '../types';
// FIX: Import GoogleGenAI and Type for Gemini API usage.
import { GoogleGenAI, Type } from "@google/genai";

interface SliksProps {
  isDarkMode: boolean;
  setActiveView: (view: AppView) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
}

interface KtpData {
  nik: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  golongan_darah: string;
  alamat: string;
  rt_rw: string;
  kel_desa: string;
  kecamatan: string;
  agama: string;
  status_perkawinan: string;
  pekerjaan: string;
  kewarganegaraan: string;
  berlaku_hingga: string;
}

const FormField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isDarkMode: boolean;
  type?: string;
  placeholder?: string;
  as?: 'input' | 'textarea';
  icon?: React.ReactNode;
}> = ({ label, value, onChange, isDarkMode, type = 'text', placeholder = '-', as = 'input', icon }) => {
  const InputComponent = as;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
            {icon}
          </div>
        )}
        <InputComponent
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 rounded-xl border-2 text-[13px] font-medium focus:outline-none transition-all ${
            isDarkMode
              ? 'bg-[#1e293b] border-[#334155] text-white placeholder-gray-600 focus:border-blue-500'
              : 'bg-gray-50 border-gray-100 text-gray-800 placeholder-gray-400 focus:border-[#004691]'
          }`}
          {...(as === 'textarea' ? { rows: 2 } : {})}
        />
      </div>
    </div>
  );
};

const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isDarkMode: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, options, onChange, isDarkMode, icon }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full ${icon ? 'pl-10' : 'px-4'} pr-10 py-3 rounded-xl border-2 text-[13px] font-medium focus:outline-none appearance-none transition-all ${
          isDarkMode
            ? 'bg-[#1e293b] border-[#334155] text-white focus:border-blue-500'
            : 'bg-gray-50 border-gray-100 text-gray-800 focus:border-[#004691]'
        }`}
      >
        <option value="" disabled>Pilih {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; isDarkMode: boolean }> = ({ title, isDarkMode }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="h-[1px] flex-1 bg-gray-100/50"></div>
    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{title}</span>
    <div className="h-[1px] flex-1 bg-gray-100/50"></div>
  </div>
);

const Sliks: React.FC<SliksProps> = ({ isDarkMode, setActiveView, addActivity }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  const [ktpData, setKtpData] = useState<KtpData>({
    nik: '', nama: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', 
    golongan_darah: '', alamat: '', rt_rw: '', kel_desa: '', kecamatan: '', 
    agama: '', status_perkawinan: '', pekerjaan: '', 
    kewarganegaraan: 'WNI', berlaku_hingga: 'SEUMUR HIDUP'
  });
  
  const [history, setHistory] = useState<{id: string; name: string; date: string; time: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        startExtraction(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const startExtraction = async (imageData: string) => {
    setIsExtracting(true);
    try {
      // FIX: Initialize GoogleGenAI with API key from environment variables.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = imageData.split(',')[1];
      // FIX: Call Gemini API to extract KTP data from the image.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ 
          text: "Ekstrak data dari KTP Indonesia ini secara detail. Pisahkan Tempat Lahir dan Tanggal Lahir (Format YYYY-MM-DD). Sertakan Golongan Darah jika tertera (A/B/AB/O). Kembalikan JSON dengan format yang diminta." 
        }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: { 
            type: Type.OBJECT, 
            properties: { 
              nik: { type: Type.STRING }, 
              nama: { type: Type.STRING }, 
              tempat_lahir: { type: Type.STRING },
              tanggal_lahir: { type: Type.STRING },
              jenis_kelamin: { type: Type.STRING },
              golongan_darah: { type: Type.STRING },
              alamat: { type: Type.STRING },
              rt_rw: { type: Type.STRING },
              kel_desa: { type: Type.STRING },
              kecamatan: { type: Type.STRING },
              agama: { type: Type.STRING },
              status_perkawinan: { type: Type.STRING },
              pekerjaan: { type: Type.STRING },
              kewarganegaraan: { type: Type.STRING },
              berlaku_hingga: { type: Type.STRING }
            } 
          }
        }
      });
      // FIX: Parse the JSON response and update the form state.
      const result = JSON.parse(response.text || '{}') as KtpData;
      setKtpData(prev => ({ ...prev, ...result }));
    } catch (error) {
      console.error("Extraction error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePasteJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(pastedJson);
      // Basic validation and mapping
      const newData: KtpData = {
        nik: parsed.nik || parsed.NIK || '',
        nama: parsed.nama || parsed.nama_lengkap || parsed.NAMA || '',
        tempat_lahir: parsed.tempat_lahir || parsed.TEMPAT_LAHIR || '',
        tanggal_lahir: parsed.tanggal_lahir || parsed.TANGGAL_LAHIR || '',
        jenis_kelamin: parsed.jenis_kelamin || parsed.JENIS_KELAMIN || '',
        golongan_darah: parsed.golongan_darah || parsed.GOL_DARAH || '',
        alamat: parsed.alamat || parsed.ALAMAT || '',
        rt_rw: parsed.rt_rw || parsed.RT_RW || '',
        kel_desa: parsed.kel_desa || parsed.KEL_DESA || '',
        kecamatan: parsed.kecamatan || parsed.KECAMATAN || '',
        agama: parsed.agama || parsed.AGAMA || '',
        status_perkawinan: parsed.status_perkawinan || parsed.STATUS_PERKAWINAN || '',
        pekerjaan: parsed.pekerjaan || parsed.PEKERJAAN || '',
        kewarganegaraan: parsed.kewarganegaraan || parsed.KEWARGANEGARAAN || 'WNI',
        berlaku_hingga: parsed.berlaku_hingga || parsed.BERLAKU_HINGGA || 'SEUMUR HIDUP'
      };
      setKtpData(prev => ({ ...prev, ...newData }));
      setShowPasteModal(false);
      setPastedJson('');
    } catch (e) {
      setJsonError('Format JSON tidak valid. Pastikan format benar.');
    }
  };

  const finalizeVerification = () => {
    const now = new Date();
    const newLog = {
      id: Date.now().toString(),
      name: ktpData.nama || 'Input Manual',
      date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(now),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [newLog, ...prev].slice(0, 5));
    addActivity({ type: 'Slik', title: 'Verifikasi KTP', status: 'Berhasil' });
    resetForm();
  };

  const resetForm = () => {
    setImage(null);
    setKtpData({
      nik: '', nama: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', 
      golongan_darah: '', alamat: '', rt_rw: '', kel_desa: '', kecamatan: '', 
      agama: '', status_perkawinan: '', pekerjaan: '', 
      kewarganegaraan: 'WNI', berlaku_hingga: 'SEUMUR HIDUP'
    });
  };

  const JENIS_KELAMIN_OPTS = ['LAKI-LAKI', 'PEREMPUAN'];
  const GOLONGAN_DARAH_OPTS = ['A', 'B', 'AB', 'O', '-'];
  const AGAMA_OPTS = ['ISLAM', 'KRISTEN', 'KATHOLIK', 'HINDU', 'BUDHA', 'KHONGHUCU'];
  const STATUS_OPTS = ['BELUM KAWIN', 'KAWIN', 'CERAI HIDUP', 'CERAI MATI'];
  const KEWARGANEGARAAN_OPTS = ['WNI', 'WNA'];

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-5 flex justify-between items-center transition-colors sticky top-0 z-20 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white border-b'}`}>
        <button onClick={() => setActiveView('home')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-[#004691]'} />
        </button>
        <div className="text-center">
          <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#004691]'}`}>SLIK Verification</h2>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Identify & Verify</p>
        </div>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6 pb-32">
        
        {/* Responsive Aspect Ratio Card (Standar KTP ID-1 ~1.58:1) */}
        <div className={`relative overflow-hidden rounded-xl border-2 transition-all shadow-sm w-full aspect-[1.58/1] ${
          isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-blue-50/30 border-blue-100 shadow-blue-900/5'
        }`}>
          {!image ? (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full h-full flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#004691] text-white'
              }`}>
                <Camera size={26} />
              </div>
              <div className="px-4 text-center">
                <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#004691]'}`}>Ambil Foto KTP</h4>
                <p className="text-[10px] text-gray-400 mt-1 font-medium leading-tight">Pastikan seluruh bagian kartu terlihat jelas</p>
              </div>
            </button>
          ) : (
            <div className="relative w-full h-full">
              <img src={image} alt="KTP Preview" className="w-full h-full object-cover" />
              
              {/* Overlay loading while extracting */}
              {isExtracting && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 animate-in fade-in duration-300">
                  <div className="relative">
                    <RefreshCw size={36} className="animate-spin text-blue-400" />
                    <div className="absolute inset-0 animate-ping border-2 border-blue-400 rounded-full scale-150 opacity-20"></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">Mengekstrak...</span>
                </div>
              )}

              {/* Success Badge after extracting */}
              {!isExtracting && ktpData.nik && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl animate-in zoom-in duration-300">
                  <div className="p-0.5 bg-white rounded-full">
                    <Check size={10} className="text-green-500 stroke-[4px]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Terekstrak</span>
                </div>
              )}

              {/* Reset button */}
              <button 
                onClick={resetForm}
                className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Paste JSON Button */}
        <button 
          onClick={() => setShowPasteModal(true)}
          className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isDarkMode 
              ? 'bg-[#1e293b] border-blue-500/30 text-blue-400' 
              : 'bg-blue-50/50 border-blue-200 text-[#004691]'
          }`}
        >
          <ClipboardPaste size={16} />
          <span className="text-[11px] font-black uppercase tracking-wider">Tempel Data JSON</span>
        </button>

        {/* Data Form */}
        <div className="space-y-6">
          <SectionTitle title="Informasi Identitas" isDarkMode={isDarkMode} />
          
          <div className="space-y-4">
            <FormField 
              label="NIK (Nomor Induk Kependudukan)" 
              value={ktpData.nik} 
              onChange={(e) => setKtpData({...ktpData, nik: e.target.value})} 
              isDarkMode={isDarkMode} 
              placeholder="16 Digit NIK"
              icon={<CreditCard size={16} />}
            />
            <FormField 
              label="Nama Lengkap" 
              value={ktpData.nama} 
              onChange={(e) => setKtpData({...ktpData, nama: e.target.value})} 
              isDarkMode={isDarkMode} 
              placeholder="Nama sesuai KTP"
              icon={<User size={16} />}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                label="Tempat Lahir" 
                value={ktpData.tempat_lahir} 
                onChange={(e) => setKtpData({...ktpData, tempat_lahir: e.target.value})} 
                isDarkMode={isDarkMode} 
                placeholder="KOTA"
                icon={<MapPin size={16} />}
              />
              <FormField 
                label="Tanggal Lahir" 
                type="date"
                value={ktpData.tanggal_lahir} 
                onChange={(e) => setKtpData({...ktpData, tanggal_lahir: e.target.value})} 
                isDarkMode={isDarkMode} 
                icon={<Calendar size={16} />}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="Jenis Kelamin" 
                value={ktpData.jenis_kelamin} 
                options={JENIS_KELAMIN_OPTS}
                onChange={(e) => setKtpData({...ktpData, jenis_kelamin: e.target.value})} 
                isDarkMode={isDarkMode} 
                icon={<UserCircle size={16} />}
              />
              <SelectField 
                label="Gol. Darah" 
                value={ktpData.golongan_darah} 
                options={GOLONGAN_DARAH_OPTS}
                onChange={(e) => setKtpData({...ktpData, golongan_darah: e.target.value})} 
                isDarkMode={isDarkMode} 
                icon={<Droplet size={16} />}
              />
            </div>

            <FormField 
              label="Alamat Lengkap" 
              value={ktpData.alamat} 
              onChange={(e) => setKtpData({...ktpData, alamat: e.target.value})} 
              isDarkMode={isDarkMode} 
              as="textarea"
              placeholder="Jalan, Blok, Nomor Rumah"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="RT / RW" value={ktpData.rt_rw} onChange={(e) => setKtpData({...ktpData, rt_rw: e.target.value})} isDarkMode={isDarkMode} placeholder="000/000" />
              <FormField label="Kel / Desa" value={ktpData.kel_desa} onChange={(e) => setKtpData({...ktpData, kel_desa: e.target.value})} isDarkMode={isDarkMode} placeholder="Kelurahan" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kecamatan" value={ktpData.kecamatan} onChange={(e) => setKtpData({...ktpData, kecamatan: e.target.value})} isDarkMode={isDarkMode} placeholder="Kecamatan" />
              <SelectField label="Agama" value={ktpData.agama} options={AGAMA_OPTS} onChange={(e) => setKtpData({...ktpData, agama: e.target.value})} isDarkMode={isDarkMode} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Status Kawin" value={ktpData.status_perkawinan} options={STATUS_OPTS} onChange={(e) => setKtpData({...ktpData, status_perkawinan: e.target.value})} isDarkMode={isDarkMode} />
              <FormField label="Pekerjaan" value={ktpData.pekerjaan} onChange={(e) => setKtpData({...ktpData, pekerjaan: e.target.value})} isDarkMode={isDarkMode} placeholder="Pekerjaan" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Kewarganegaraan" value={ktpData.kewarganegaraan} options={KEWARGANEGARAAN_OPTS} onChange={(e) => setKtpData({...ktpData, kewarganegaraan: e.target.value})} isDarkMode={isDarkMode} icon={<Globe size={16} />} />
              <FormField label="Berlaku Hingga" value={ktpData.berlaku_hingga} onChange={(e) => setKtpData({...ktpData, berlaku_hingga: e.target.value})} isDarkMode={isDarkMode} placeholder="SEUMUR HIDUP" />
            </div>

            <button 
              onClick={finalizeVerification}
              disabled={!ktpData.nik || !ktpData.nama || isExtracting}
              className={`w-full py-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 ${
                isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/30' : 'bg-[#004691] text-white shadow-blue-900/20'
              }`}
            >
              SIMPAN VERIFIKASI <CheckCircle2 size={16} />
            </button>
          </div>
        </div>

        {/* Local History */}
        <div className="space-y-4 pt-4">
          <h3 className={`font-black text-xs tracking-tight px-1 ${isDarkMode ? 'text-gray-200' : 'text-[#004691]'}`}>Riwayat Sesi Ini</h3>
          <div className={`rounded-2xl divide-y shadow-sm border transition-colors ${
            isDarkMode ? 'bg-[#1e293b] divide-white/5 border-white/5' : 'bg-gray-50 divide-gray-100 border-gray-100'
          }`}>
            {history.length > 0 ? (
              history.map((log) => (
                <div key={log.id} className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Search size={18} /></div>
                    <div>
                      <p className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{log.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{log.date} • {log.time}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 rounded-full text-[9px] font-black text-green-500 uppercase">Success</div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6 gap-3 text-gray-300">
                <Database size={32} className="opacity-20" />
                <p className="text-[10px] font-bold">Belum ada riwayat pengecekan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paste JSON Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl transform animate-in zoom-in duration-300 ${
            isDarkMode ? 'bg-[#1e293b] border border-white/10' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-[#004691]'}`}>
                  <ClipboardPaste size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#004691]'}`}>Tempel JSON</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Input Data Cepat</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPasteModal(false)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              placeholder='{ "nik": "123...", "nama": "ANDIKA..." }'
              className={`w-full h-40 p-4 rounded-2xl text-[12px] font-mono focus:outline-none border-2 transition-all mb-4 ${
                isDarkMode 
                  ? 'bg-[#0f172a] border-[#334155] text-blue-300 focus:border-blue-500' 
                  : 'bg-gray-50 border-gray-100 text-gray-700 focus:border-[#004691]'
              }`}
            />

            {jsonError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold flex items-center gap-2">
                <CheckCircle2 size={12} className="rotate-45" />
                {jsonError}
              </div>
            )}

            <button
              onClick={handlePasteJson}
              disabled={!pastedJson.trim()}
              className={`w-full py-4 rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${
                isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/30' : 'bg-[#004691] text-white shadow-blue-900/20'
              }`}
            >
              PROSES DATA <Check size={16} strokeWidth={4} />
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .animate-in { animation-fill-mode: forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation-name: fade-in; }
        @keyframes zoom-in { from { transform: scale(0.95); } to { transform: scale(1); } }
        .zoom-in { animation-name: zoom-in; }
        select { background-image: none !important; }
      `}</style>
    </div>
  );
};

export default Sliks;

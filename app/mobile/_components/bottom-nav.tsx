
'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, QrCode, MessageSquare, User } from 'lucide-react';

const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};

export default function BottomNav() {
  const pathname = usePathname();
  const isSliksActive = pathname.startsWith('/mobile/sliks');

  return (
    <nav className="absolute bottom-0 left-0 right-0 border-t px-6 py-2 flex justify-around items-center safe-bottom z-50 transition-colors duration-300 bg-[#1e293b] border-[#334155] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <NavItem href="/mobile" icon={<Home size={24} />} label="Home" />
      <NavItem href="/mobile/history" icon={<History size={24} />} label="History" />
      <Link
        href="/mobile/sliks"
        className="relative -top-6 bg-[#004691] p-4 rounded-full shadow-lg border-4 border-inherit cursor-pointer transform active:scale-95 transition-transform flex items-center justify-center"
        style={{ borderColor: '#1e293b' }}
      >
        <QrCode size={30} color="white" />
        <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold ${isSliksActive ? 'text-blue-400' : 'text-gray-500'}`}>SLIK</span>
      </Link>
      <NavItem href="/mobile/ai-assistant" icon={<MessageSquare size={24} />} label="AI Chat" />
      <NavItem href="/mobile/profile" icon={<User size={24} />} label="Profile" />
    </nav>
  );
}

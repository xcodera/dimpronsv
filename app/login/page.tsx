
'use client'

import { useState } from 'react';
import { Box, User, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';
import { login } from './actions';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success, middleware handles redirection, so we don't need to do anything here.
    // If the page doesn't redirect, it means login failed, so we stop loading.
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#111827] font-sans">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-3 shadow-lg">
            <Box size={32} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wider">DIMPro</h1>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-white text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-400 mt-2 text-sm">Professional access to your enterprise dashboard</p>
        </div>
        
        <div className="w-full bg-[#1F2937]/50 border border-gray-700 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
          <form action={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-400">Username</label>
              <div className="relative mt-2">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter Username"
                  className="w-full bg-[#111827]/70 border-2 border-gray-700 text-white placeholder-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-11 p-3 transition-all"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400">Password</label>
              <div className="relative mt-2">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  className="w-full bg-[#111827]/70 border-2 border-gray-700 text-white placeholder-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-11 p-3 transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

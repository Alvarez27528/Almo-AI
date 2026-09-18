import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface State { hasError: boolean; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('UI crashed:', error instanceof Error ? error.message : error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F7] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6 animate-fade-up">
          <div className="mx-auto w-14 h-14 rounded-[18px] bg-[#121214] border border-white/8 flex items-center justify-center text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">Algo no ha ido bien</h1>
            <p className="text-[13px] text-[#8E8E93] leading-relaxed">
              Tus datos están a salvo. Recarga la aplicación para continuar.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-[#E5E5EA] active:scale-[0.98]"
          >
            <RefreshCw size={14} /> Recargar
          </button>
        </div>
      </div>
    );
  }
}

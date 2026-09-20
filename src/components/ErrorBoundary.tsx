import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, LogOut, Copy, Check } from 'lucide-react';
import { auth, signOut } from '../firebase';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out from ErrorBoundary:', e);
    }
    window.location.reload();
  };

  private handleCopyError = () => {
    const details = `Error: ${this.state.error?.message || 'Desconocido'}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponentStack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(details).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-lg bg-slate-800 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {this.props.fallbackTitle || 'Algo no cargó como se esperaba'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                FriendSearcher detectó un error al renderizar los datos. No te preocupes, tus datos en la base de datos están seguros.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-700 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-40">
              <p className="font-bold text-rose-400 mb-1">Detalle del error:</p>
              <p className="break-all">{this.state.error?.message || 'Error de ejecución no identificado.'}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar página</span>
              </button>

              <button
                onClick={this.handleCopyError}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Copiar detalles técnicos para reportar el error"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar detalle</span>
                  </>
                )}
              </button>

              <button
                onClick={this.handleSignOut}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 pt-2">
              También puedes abrir la consola de desarrollo del navegador (<kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono">F12</kbd> o <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono">Cmd+Option+I</kbd>) para ver el registro completo.
            </p>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

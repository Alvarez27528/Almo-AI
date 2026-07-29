/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { AppState, ChatMessage, SavedChat } from '../types';
import { calculateFinancialStats } from '../utils/finance';
import { 
  Send, 
  Sparkles, 
  Clock,
  User,
  BrainCircuit,
  Zap,
  Lock,
  Unlock,
  ShieldAlert,
  History,
  Edit2,
  Trash2,
  Plus,
  Save,
  Check,
  X,
  MessageSquare,
  Star
} from 'lucide-react';

interface AIChatProps {
  state: AppState;
  onAddMessage: (msg: ChatMessage) => void;
  onUpdateLastMessage?: (text: string) => void;
  onIncrementTokens?: () => void;
  onSetUserRank?: (rank: 'Normal' | 'VIP') => void;
  onClearChat: () => void;
  onUpdateSavedChats?: (savedChats: SavedChat[]) => void;
  onLoadChatHistory?: (history: ChatMessage[]) => void;
}

// Helper to parse bold (**text**), inline backticks (`code`), and highlight currency values
function parseInlineStyles(rawText: string) {
  // Regex for bold text: **bold**
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(rawText)) !== null) {
    const plainText = rawText.substring(lastIndex, match.index);
    if (plainText) {
      parts.push(...parseCurrencyAndCode(plainText));
    }
    parts.push(
      <strong key={`bold-${match.index}`} className="font-extrabold text-[#00FF66] drop-shadow-[0_0_1px_rgba(0,255,102,0.1)]">
        {match[1]}
      </strong>
    );
    lastIndex = boldRegex.lastIndex;
  }
  
  const remainingText = rawText.substring(lastIndex);
  if (remainingText) {
    parts.push(...parseCurrencyAndCode(remainingText));
  }

  return parts;
}

function parseCurrencyAndCode(rawText: string): React.ReactNode[] {
  // Look for inline code backtick split first
  const codeRegex = /`(.*?)`/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = codeRegex.exec(rawText)) !== null) {
    const plainText = rawText.substring(lastIndex, match.index);
    if (plainText) {
      parts.push(...highlightCurrenciesInText(plainText));
    }
    parts.push(
      <code key={`code-${match.index}`} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-950 border border-[#ffffff10] text-amber-400 font-medium">
        {match[1]}
      </code>
    );
    lastIndex = codeRegex.lastIndex;
  }
  
  const remainingText = rawText.substring(lastIndex);
  if (remainingText) {
    parts.push(...highlightCurrenciesInText(remainingText));
  }
  
  return parts;
}

function highlightCurrenciesInText(rawText: string): React.ReactNode[] {
  // Regex matching numbers followed by € or EUR or prefixed with €/$
  // e.g. "120 €", "120€", "-45.50€", "1.500 €", "2000 EUR", "10 €"
  const currencyRegex = /(-?\d+[\d.,]*\s*(?:€|EUR))/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = currencyRegex.exec(rawText)) !== null) {
    const plainText = rawText.substring(lastIndex, match.index);
    if (plainText) {
      parts.push(plainText);
    }
    parts.push(
      <span key={`currency-${match.index}`} className="font-bold text-[#00FF66] tracking-tight bg-[#00FF66]/10 px-1.5 py-0.5 rounded-md border border-[#00FF66]/25 shadow-[0_0_8px_rgba(0,255,102,0.1)] mx-0.5">
        {match[1]}
      </span>
    );
    lastIndex = currencyRegex.lastIndex;
  }
  
  const remainingText = rawText.substring(lastIndex);
  if (remainingText) {
    parts.push(remainingText);
  }
  
  return parts;
}

function renderMarkdownContent(text: string) {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: 'bullet' | 'number' | null = null;
  
  const flushList = (key: string | number) => {
    if (listItems.length > 0) {
      if (listType === 'bullet') {
        renderedElements.push(
          <ul key={`list-${key}`} className="space-y-3.5 my-5 pl-1.5">
            {...listItems}
          </ul>
        );
      } else {
        renderedElements.push(
          <ol key={`list-${key}`} className="space-y-3.5 my-5 pl-1.5">
            {...listItems}
          </ol>
        );
      }
      listItems = [];
      inList = false;
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushList(i);
      continue;
    }

    // Check Headers
    if (line.startsWith('### ')) {
      flushList(i);
      const headerText = line.substring(4);
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-base sm:text-lg md:text-xl font-extrabold text-white mt-6 mb-3.5 flex items-center gap-2 border-l-4 border-[#00FF66] pl-3">
          {parseInlineStyles(headerText)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      flushList(i);
      const headerText = line.substring(3);
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-lg sm:text-xl md:text-2xl font-extrabold text-white mt-7 mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
          {parseInlineStyles(headerText)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      flushList(i);
      const headerText = line.substring(2);
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-8 mb-5 flex items-center gap-2 border-l-4 border-emerald-400 pl-3">
          {parseInlineStyles(headerText)}
        </h1>
      );
    } 
    // Check Bullet List
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (inList && listType !== 'bullet') {
        flushList(i);
      }
      inList = true;
      listType = 'bullet';
      const itemText = line.substring(2);
      listItems.push(
        <li key={`li-${i}`} className="flex items-start space-x-2.5 text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed font-sans font-medium">
          <span className="text-[#00FF66] shrink-0 mt-2 select-none text-[10px] sm:text-[12px]">✦</span>
          <span className="flex-1">{parseInlineStyles(itemText)}</span>
        </li>
      );
    } 
    // Check Numbered List
    else if (/^\d+\.\s/.test(line)) {
      if (inList && listType !== 'number') {
        flushList(i);
      }
      inList = true;
      listType = 'number';
      const match = line.match(/^(\d+)\.\s(.*)/);
      const num = match ? match[1] : '1';
      const itemText = match ? match[2] : line.substring(3);
      listItems.push(
        <li key={`li-${i}`} className="flex items-start space-x-2.5 text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed font-sans font-medium">
          <span className="flex items-center justify-center font-mono font-extrabold text-[10px] sm:text-[11px] w-5 h-5 rounded bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/20 shrink-0 mt-1 select-none">
            {num}
          </span>
          <span className="flex-1">{parseInlineStyles(itemText)}</span>
        </li>
      );
    } 
    // Regular Paragraph
    else {
      flushList(i);
      renderedElements.push(
        <p key={`p-${i}`} className="text-sm sm:text-base md:text-lg text-slate-200 font-medium font-sans leading-relaxed mb-4">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  // Flush any remaining list
  flushList('end');

  return <div className="space-y-1 w-full">{renderedElements}</div>;
}

// 📦 REUSABLE INDEPENDENT ASSISTANT MESSAGE COMPONENT
function AssistantMessage({ text, timestamp }: { text: string; timestamp: string }) {
  const lines = text.split('\n').filter(Boolean);
  
  // Filter out header lines
  const contentLines = lines.filter(l => l.trim() !== '' && !l.includes('✨') && !l.includes('FIDUCIA AI'));
  const mainText = contentLines.join('\n');

  return (
    <div className="space-y-4 w-full font-sans">
      <div className="text-slate-100 leading-relaxed font-sans text-left">
        {renderMarkdownContent(mainText)}
      </div>
      
      <span className="text-[11px] sm:text-xs text-slate-500 block text-right font-mono select-none mt-2">{timestamp}</span>
    </div>
  );
}

export default function AIChat({ 
  state, 
  onAddMessage, 
  onUpdateLastMessage,
  onIncrementTokens, 
  onSetUserRank, 
  onClearChat,
  onUpdateSavedChats,
  onLoadChatHistory
}: AIChatProps) {
  const profile = state.userProfile!;
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false); // Open by default on desktop, closed on mobile
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const userRank = state.userRank || 'Normal';
  const tokensUsed = state.aiTokensUsed || 0;
  
  const isVIP = userRank === 'VIP';
  const savedChats = state.savedChats || [];

  // Base 5 queries + up to 15 from challenges (24 challenges * 0.625 = 15) to reach max 20
  const completedChallengesCount = state.challenges ? state.challenges.filter(ch => ch.isCompleted).length : 0;
  const maxNormalTokens = 5 + Math.floor(completedChallengesCount * 0.625);
  const isLimitReached = userRank === 'Normal' && tokensUsed >= maxNormalTokens;

  const quickPrompts = [
    '¿Puedo comprar un ordenador de 1800 €?',
    '¿Cuánto puedo gastar este fin de semana?',
    '¿Cómo reduzco mis gastos de ocio?',
    '¿Cuándo llegaré a acumular 10.000 €?'
  ];

  // 24-hour Auto-clear logic & Live countdown timer for Normal/Free users
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    if (userRank !== 'Normal') return;

    const updateTimer = () => {
      let lastClear = localStorage.getItem('almo_last_chat_clear_timestamp');
      const now = Date.now();
      
      if (!lastClear) {
        localStorage.setItem('almo_last_chat_clear_timestamp', now.toString());
        lastClear = now.toString();
      }

      const targetTime = parseInt(lastClear, 10) + 24 * 60 * 60 * 1000;
      const diff = targetTime - now;

      if (diff <= 0) {
        onClearChat();
        localStorage.setItem('almo_last_chat_clear_timestamp', now.toString());
        setTimeLeftStr('24h 00m 00s');
        console.log("Chat vaciado automáticamente tras 24 horas (Usuario Normal)");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (n: number) => String(n).padStart(2, '0');
        setTimeLeftStr(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userRank, onClearChat]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading || isLimitReached) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Increment tokens before fetching
    if (onIncrementTokens) {
      onIncrementTokens();
    }
    
    onAddMessage(userMsg);
    setInputText('');
    setLoading(true);

    try {
      const stats = calculateFinancialStats(state);
      
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: state.chatHistory,
          profile,
          stats
        })
      });

      if (!response.ok) {
        const errData = await response.text().catch(() => '');
        throw new Error(errData || 'API server chat error');
      }

      // Add initial empty assistant message for streaming
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: '',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      };
      onAddMessage(assistantMsg);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          
          if (onUpdateLastMessage) {
            onUpdateLastMessage(accumulatedText);
          }
        }
      }
    } catch (error) {
      console.error('Chat AI failed:', error);
      onAddMessage({
        sender: 'assistant',
        text: `Lo siento, no he podido procesar tu solicitud. Asegúrate de tener conexión estable. Error: ${error}`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVIP = () => {
    if (onSetUserRank) {
      onSetUserRank('VIP');
    }
  };

  const handleSaveChat = () => {
    if (!isVIP) return;
    if (state.chatHistory.length === 0) return;
    
    if (activeChatId) {
      // Update existing chat
      const updated = savedChats.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            history: state.chatHistory,
            updatedAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          };
        }
        return c;
      });
      if (onUpdateSavedChats) onUpdateSavedChats(updated);
    } else {
      // Create new saved chat
      const firstUserMsg = state.chatHistory.find(m => m.sender === 'user')?.text || '';
      const defaultTitle = firstUserMsg 
        ? (firstUserMsg.length > 25 ? firstUserMsg.substring(0, 25) + '...' : firstUserMsg)
        : `Conversación ${savedChats.length + 1}`;
        
      const newSavedChat: SavedChat = {
        id: `chat-${Date.now()}`,
        title: defaultTitle,
        history: state.chatHistory,
        updatedAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      };
      const updated = [newSavedChat, ...savedChats];
      if (onUpdateSavedChats) onUpdateSavedChats(updated);
      setActiveChatId(newSavedChat.id);
    }
  };

  const handleDeleteSavedChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVIP) return;
    const updated = savedChats.filter(c => c.id !== id);
    if (onUpdateSavedChats) onUpdateSavedChats(updated);
    if (activeChatId === id) {
      setActiveChatId(null);
      onClearChat();
    }
  };

  const handleStartRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameTitle(title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!renameTitle.trim() || !isVIP) return;
    const updated = savedChats.map(c => {
      if (c.id === id) {
        return { ...c, title: renameTitle.trim() };
      }
      return c;
    });
    if (onUpdateSavedChats) onUpdateSavedChats(updated);
    setRenamingId(null);
    setRenameTitle('');
  };

  const handleLoadSavedChat = (chat: SavedChat) => {
    if (!isVIP) return;
    setActiveChatId(chat.id);
    if (onLoadChatHistory) {
      onLoadChatHistory(chat.history);
    }
  };

  const handleCreateNewChat = () => {
    setActiveChatId(null);
    onClearChat();
  };

  // Auto-save message updates when user is chatting inside an active saved chat
  useEffect(() => {
    if (!isVIP || !activeChatId || state.chatHistory.length === 0) return;
    const activeChat = savedChats.find(c => c.id === activeChatId);
    if (activeChat) {
      const hasHistoryChanged = JSON.stringify(activeChat.history) !== JSON.stringify(state.chatHistory);
      if (hasHistoryChanged) {
        const updated = savedChats.map(c => {
          if (c.id === activeChatId) {
            return { 
              ...c, 
              history: state.chatHistory,
              updatedAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            };
          }
          return c;
        });
        if (onUpdateSavedChats) {
          onUpdateSavedChats(updated);
        }
      }
    }
  }, [state.chatHistory, activeChatId, isVIP, savedChats, onUpdateSavedChats]);

  return (
    <div id="chat-container" className="bg-[#0B0F19] flex flex-col h-full w-full relative overflow-hidden">
      
      {/* Top Banner with Rank Info */}
      <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-[#ffffff08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-[#00FF66] transition-colors relative flex items-center justify-center cursor-pointer"
            title="Ver Historial de Chats"
          >
            <History size={18} />
            {isVIP && savedChats.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00FF66] rounded-full animate-pulse" />
            )}
          </button>
          
          <div className="p-2 bg-[#00FF66]/10 text-[#00FF66] rounded-xl shadow-[0_0_15px_rgba(0,255,102,0.15)]">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              Chat Inteligente ALMO AI
              <span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-ping" />
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Asesor fiduciario activo</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onClearChat}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-[10px] hover:bg-red-900/50 hover:text-red-200 transition-all uppercase flex items-center gap-1 cursor-pointer"
          >
            Vaciar Chat
          </button>

          {/* Normal Mode Reset Timer */}
          {userRank === 'Normal' && timeLeftStr && (
            <div className="bg-slate-900/90 border border-blue-500/20 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 text-[10px] text-blue-400 font-mono shadow-md">
              <Clock size={11} className="text-blue-400 animate-pulse" />
              <span>REINICIO: <strong className="font-bold">{timeLeftStr}</strong></span>
            </div>
          )}
          
          {/* Token Usage Meter */}
          <div className="bg-slate-900/90 border border-[#ffffff08] px-3 py-1.5 rounded-xl flex items-center space-x-2 text-[11px]">
            <span className="text-slate-400 font-medium">Uso IA:</span>
            {userRank === 'VIP' ? (
              <span className="text-[#00FF66] font-bold flex items-center gap-1 font-mono">
                <Zap size={11} className="fill-[#00FF66]" /> ILIMITADO VIP
              </span>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold font-mono">{tokensUsed}/{maxNormalTokens}</span>
                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (tokensUsed / maxNormalTokens) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {userRank === 'Normal' && (
            <button
              onClick={handleActivateVIP}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-extrabold text-[10px] hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] transition-all uppercase flex items-center gap-1 cursor-pointer"
            >
              <Zap size={10} className="fill-black" /> Hacerse VIP
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        {/* COLLAPSIBLE SIDEBAR FOR CHAT LIST */}
        {sidebarOpen && (
          <div className="w-72 bg-[#090d16] border-r border-[#ffffff05] flex flex-col shrink-0 h-full absolute inset-y-0 left-0 z-30 lg:static shadow-2xl">
            <div className="p-3.5 border-b border-[#ffffff05] flex items-center justify-between bg-gradient-to-r from-[#00FF66]/5 to-transparent">
              <span className="text-[10px] font-extrabold bg-gradient-to-r from-[#00FF66] via-emerald-400 to-[#10B981] bg-clip-text text-transparent tracking-widest uppercase font-mono flex items-center gap-1.5">
                <Star size={11} className="text-[#00FF66] fill-[#00FF66]/20 animate-pulse" /> CHATS GUARDADOS VIP
              </span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="p-3">
              <button 
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-[#ffffff08] hover:border-[#00FF66]/30 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[#00FF66]/5"
              >
                <Plus size={14} className="text-[#00FF66]" /> Nueva conversación
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
              {isVIP ? (
                savedChats.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                    <MessageSquare size={24} className="text-slate-600 animate-pulse" />
                    <p className="text-[11px] text-slate-400 font-sans">
                      No tienes chats guardados. ¡Chatea y guárdalos!
                    </p>
                    {state.chatHistory.length > 0 && (
                      <button 
                        onClick={handleSaveChat}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-[#00FF66]/10 text-[#00FF66] hover:bg-[#00FF66]/20 border border-[#00FF66]/25 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        <Save size={12} /> Guardar chat actual
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedChats.map((chat) => {
                      const isActive = activeChatId === chat.id;
                      const isRenaming = renamingId === chat.id;
                      return (
                        <div key={chat.id}>
                          {isRenaming ? (
                            <form 
                              onSubmit={(e) => handleSaveRename(chat.id, e)}
                              className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-[#ffffff12] rounded-xl"
                            >
                              <input 
                                type="text"
                                value={renameTitle}
                                onChange={e => setRenameTitle(e.target.value)}
                                className="bg-transparent border-0 text-xs text-white focus:outline-none focus:ring-0 flex-1 p-1 min-w-0"
                                autoFocus
                              />
                              <button type="submit" className="text-[#00FF66] hover:opacity-80 p-1">
                                <Check size={14} />
                              </button>
                              <button type="button" onClick={() => setRenamingId(null)} className="text-red-400 hover:opacity-80 p-1">
                                <X size={14} />
                              </button>
                            </form>
                          ) : (
                            <div 
                              onClick={() => handleLoadSavedChat(chat)}
                              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                                isActive 
                                  ? 'bg-gradient-to-r from-[#00FF66]/15 to-[#00FF66]/5 border-[#00FF66]/35 border-l-4 border-l-[#00FF66] text-white shadow-[0_0_15px_rgba(0,255,102,0.12)] scale-[1.02]' 
                                  : 'bg-slate-950/40 hover:bg-slate-900/80 border-[#ffffff05] hover:border-[#ffffff12] text-slate-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 overflow-hidden flex-1">
                                <MessageSquare size={14} className={`shrink-0 mt-0.5 ${isActive ? 'text-[#00FF66] animate-pulse' : 'text-slate-500'}`} />
                                <div className="overflow-hidden">
                                  <span className={`text-xs font-bold block truncate leading-tight ${isActive ? 'text-[#00FF66]' : 'text-slate-200 group-hover:text-white'}`}>{chat.title}</span>
                                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{chat.updatedAt}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0">
                                <button 
                                  onClick={(e) => handleStartRename(chat.id, chat.title, e)}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#00FF66] transition-colors"
                                  title="Cambiar nombre"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button 
                                  onClick={(e) => handleDeleteSavedChat(chat.id, e)}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* LOCKED SIDEBAR VIEW FOR NORMAL USERS */
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-center shadow-lg">
                      <Lock size={20} className="text-amber-400 mx-auto" />
                      <h4 className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider font-mono">Historial VIP</h4>
                      <p className="text-[10px] text-slate-400 leading-normal font-sans">
                        Guarda tus consultas de forma permanente, crea múltiples chats temáticos y reescribe sus títulos.
                      </p>
                    </div>
                    
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-1.5 text-center shadow-lg">
                      <Clock size={18} className="text-blue-400 mx-auto animate-pulse" />
                      <h5 className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider font-mono">Tiempo Restante</h5>
                      {timeLeftStr ? (
                        <p className="text-sm font-bold text-blue-400 font-mono tracking-wider">{timeLeftStr}</p>
                      ) : (
                        <p className="text-sm font-bold text-blue-400 font-mono tracking-wider">Cargando...</p>
                      )}
                      <p className="text-[9px] text-slate-400 leading-normal font-sans pt-1 border-t border-[#ffffff05]">
                        Los chats de usuarios normales se limpian cada 24 horas. ¡Hazte VIP para conservar tu historial para siempre!
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleActivateVIP}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-extrabold text-xs rounded-xl hover:shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer shrink-0 tracking-wider font-mono"
                  >
                    <Zap size={11} className="fill-black animate-bounce" /> RANGO VIP GRATIS
                  </button>
                </div>
              )}
            </div>

            {isVIP && state.chatHistory.length > 0 && (
              <div className="p-3 border-t border-[#ffffff05] bg-slate-950/20">
                <button 
                  onClick={handleSaveChat}
                  className="w-full py-2 px-3 bg-gradient-to-r from-[#00FF66] to-[#10B981] hover:opacity-95 text-black font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider font-mono shadow-md cursor-pointer animate-pulse"
                >
                  <Save size={13} /> {activeChatId ? 'Actualizar guardado' : 'Guardar chat actual'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MAIN MESSAGES AREA */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-[#090d16] overflow-hidden">
          {/* Main Messages viewport */}
          <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-4 sm:p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            
            {/* Quick Suggestions (Only if chat history has only 1 system welcome message) */}
            {state.chatHistory.length <= 1 && !isLimitReached && (
              <div className="max-w-2xl mx-auto w-full py-10 sm:py-16 text-center space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-[#00FF66]/10 text-[#00FF66] rounded-2xl shadow-[0_0_25px_rgba(0,255,102,0.15)] border border-[#00FF66]/20">
                    <BrainCircuit size={36} />
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    ¿En qué puedo ayudarte hoy, {profile.name}?
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400 font-sans max-w-md mx-auto">
                    Consúltame sobre presupuestos, metas de ahorro o pídeme un plan fiduciario estructurado.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="p-4 text-left bg-slate-900/80 hover:bg-[#00FF66]/5 border border-[#ffffff08] hover:border-[#00FF66]/20 rounded-xl text-xs sm:text-sm text-slate-300 hover:text-white transition-all font-semibold shadow-sm cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Chats list with centered max-w-3xl ChatGPT style */}
            {state.chatHistory.length > 0 && (
              <div className="max-w-3xl mx-auto w-full space-y-8 py-4 sm:py-6">
                {state.chatHistory.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex items-start gap-3 sm:gap-4 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Assistant Avatar */}
                      {!isUser && (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 shrink-0 mt-1">
                          <Sparkles size={18} />
                        </div>
                      )}

                      {/* Message body */}
                      <div className={`leading-relaxed ${
                        isUser 
                          ? 'p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 font-medium text-sm sm:text-base md:text-lg max-w-[85%] sm:max-w-[75%] shadow-md'
                          : 'flex-1 text-white px-2 sm:px-4 py-2 bg-transparent border-0 w-full'
                      }`}>
                        {isUser ? (
                          <>
                            <p className="whitespace-pre-line font-sans">{msg.text}</p>
                            <span className="text-[10px] text-slate-500 block text-right mt-2 font-mono">{msg.timestamp}</span>
                          </>
                        ) : (
                          <AssistantMessage text={msg.text} timestamp={msg.timestamp} />
                        )}
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800 text-slate-300 shrink-0">
                          <User size={18} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Streaming loading dots */}
                {loading && (!state.chatHistory.length || state.chatHistory[state.chatHistory.length - 1].sender !== 'assistant' || !state.chatHistory[state.chatHistory.length - 1].text) && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex items-start gap-3 sm:gap-4 w-full justify-start"
                  >
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 shrink-0 mt-1">
                      <Sparkles className="animate-spin" size={18} />
                    </div>
                    <div className="flex-1 px-2 sm:px-4 py-2 text-sm sm:text-base md:text-lg text-slate-400 flex items-center gap-3 font-mono font-medium">
                      <span className="animate-pulse">Analizando tus saldos y estructurando...</span>
                      <div className="flex space-x-1.5">
                        <span className="h-2 w-2 bg-[#00FF66] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-[#00FF66] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-[#00FF66] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Locked Overlay if Limit Reached */}
            {isLimitReached && (
              <div className="max-w-3xl mx-auto w-full">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-gradient-to-b from-[#1E120A] to-[#120B05] border border-amber-500/20 rounded-2xl space-y-4 shadow-xl"
                >
                  <div className="flex items-center space-x-3 text-amber-400">
                    <ShieldAlert size={24} />
                    <h3 className="font-bold text-sm sm:text-base">Límite de Consultas Inteligentes Alcanzado</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Has consumido tus <span className="text-amber-400 font-bold">{maxNormalTokens} consultas de IA gratuitas</span> asignadas para tu nivel actual.
                  </p>
                  
                  {/* Gamification Explainer */}
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles size={12} className="fill-amber-400" /> ¡Consigue más Consultas Gratis con Retos!
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans">
                      No queremos que te vayas ni que tengas que pagar. En ALMO AI premiamos tu constancia y disciplina de ahorro de forma real:
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans pl-4 list-disc">
                      <li><strong className="text-amber-400">+5 Consultas IA permanentes</strong> por cada <strong>Reto de Ahorro</strong> semanal completado.</li>
                      <li><strong className="text-amber-400">+3 Consultas IA permanentes</strong> cada vez que <strong>Subas de Nivel</strong> (XP por registrar movimientos, metas, etc.).</li>
                    </ul>
                    <p className="text-[10px] text-slate-500 italic">
                      ¡Tienes retos activos en la sección de "Retos de Ahorro"! Solo completa tus misiones de ahorro semanales y reclama la recompensa.
                    </p>
                  </div>

                  <div className="p-4 bg-black/40 rounded-xl space-y-2 border border-[#ffffff05]">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Beneficios VIP de ALMO AI:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#00FF66]">✓</span> Consultas de IA Ilimitadas
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#00FF66]">✓</span> Simulador Financiero Desbloqueado
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#00FF66]">✓</span> Acceso Completo a Planes Estratégicos
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#00FF66]">✓</span> Gestión Pyme / Modo Vinted
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleActivateVIP}
                    className="w-full py-3 bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-extrabold text-xs sm:text-sm rounded-xl hover:shadow-[0_0_25px_rgba(0,255,102,0.4)] transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap size={14} className="fill-black" /> ¡ACTIVAR RANGO VIP GRATIS AHORA!
                  </button>
                </motion.div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Centered Premium Bottom Message Input Bar */}
          <div className="bg-[#090d16] border-t border-[#ffffff05] py-4 w-full shrink-0">
            <div className="max-w-3xl mx-auto px-4 w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                className="relative flex items-center bg-[#121824] border border-[#ffffff10] rounded-2xl p-1 focus-within:border-[#00FF66]/40 focus-within:ring-2 focus-within:ring-[#00FF66]/10 transition-all shadow-lg"
              >
                <input
                  type="text"
                  required
                  disabled={loading || isLimitReached}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isLimitReached ? "Consigue rango VIP para continuar..." : "Pregunta sobre tus saldos, ahorros..."}
                  className="flex-1 bg-transparent border-0 px-4 py-3 sm:py-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 disabled:opacity-50 font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || loading || isLimitReached}
                  className="p-3 sm:p-3.5 bg-gradient-to-r from-[#00FF66] to-[#10B981] hover:opacity-90 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer shrink-0 ml-1"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-500 mt-2 font-sans select-none">
                ALMO AI puede cometer errores. Considera verificar la información importante.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

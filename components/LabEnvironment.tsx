import React, { useState, useEffect, useRef } from 'react';
import { LabState, LabType, TerminalLine, ChatMessage } from '../types';
import { evaluateLabAction, chatWithTutor } from '../services/geminiService';
import { Terminal } from './Terminal';
import { Visualizer } from './Visualizer';
import {  Bot, CheckCircle, AlertCircle, HelpCircle, Send, Play, Terminal as TerminalIcon, Book, MessageSquare, Menu, FileText, Target } from 'lucide-react';

interface LabEnvironmentProps {
  lab: LabState;
  onComplete: () => void;
}

export const LabEnvironment: React.FC<LabEnvironmentProps> = ({ lab, onComplete }) => {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: 'system', content: `Environment Initialized: ${lab.language || 'Shell'}` },
  ]);
  const [code, setCode] = useState(lab.initialCode || '');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'GUIDE' | 'TUTOR'>('GUIDE');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTerminalLines([{ type: 'system', content: `Environment Initialized: ${lab.language || 'Shell'}` }]);
    setCode(lab.initialCode || '');
    setSuccessMsg(null);
    setChatHistory([{ role: 'model', content: "I'm ready to help. Check the Guide tab for instructions.", timestamp: Date.now() }]);
  }, [lab]);

  useEffect(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  const handleRunCode = async () => {
    setIsProcessing(true);
    setTerminalLines(prev => [...prev, { type: 'system', content: `Compiling ${lab.language || 'code'}...` }]);
    
    const result = await evaluateLabAction(lab, code, "User submitted code.");
    
    setTerminalLines(prev => [...prev, { type: result.success ? 'output' : 'error', content: result.output }]);

    if (result.feedback) {
        setChatHistory(prev => [...prev, {role: 'model', content: `Feedback: ${result.feedback}`, timestamp: Date.now()}]);
        setActiveTab('TUTOR'); // Switch to tutor to show feedback
    }

    if (result.isComplete) {
        setSuccessMsg("Objective Complete!");
    }
    setIsProcessing(false);
  };

  const handleTerminalCommand = async (cmd: string) => {
    setTerminalLines(prev => [...prev, { type: 'input', content: cmd }]);
    setIsProcessing(true);
    const historyStr = terminalLines.map(l => l.content).join('\n');
    const result = await evaluateLabAction(lab, cmd, historyStr);
    
    setTerminalLines(prev => [...prev, { type: result.success ? 'output' : 'error', content: result.output }]);
    
    if (result.isComplete) setSuccessMsg("Objective Complete!");
    setIsProcessing(false);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newMsg]);
    setChatInput('');
    const response = await chatWithTutor(lab.title, chatHistory.map(h => ({ role: h.role, content: h.content })), newMsg.content);
    setChatHistory(prev => [...prev, { role: 'model', content: response, timestamp: Date.now() }]);
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 animate-fade-in">
      
      {/* SIDEBAR: GUIDE & TUTOR (350px fixed) */}
      <div className="w-96 flex flex-col bg-white border-r border-slate-200 shadow-xl z-20">
         {/* Tab Header */}
         <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('GUIDE')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'GUIDE' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Book size={16} /> Lab Guide
              {activeTab === 'GUIDE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-scale-in"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('TUTOR')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'TUTOR' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare size={16} /> AI Tutor
              {activeTab === 'TUTOR' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-scale-in"></div>}
            </button>
         </div>

         {/* GUIDE TAB CONTENT */}
         {activeTab === 'GUIDE' && (
           <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-slide-right">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{lab.title}</h2>
                {lab.scenario && (
                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900 italic shadow-sm">
                        <FileText size={16} className="inline mr-2 mb-1 text-indigo-500"/>
                        {lab.scenario}
                    </div>
                )}
                
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h3>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {lab.instruction}
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm">
                <h3 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                  <Target size={16} /> Mission Goal
                </h3>
                <p className="text-sm text-green-700">{lab.goal}</p>
              </div>

              {lab.hints.length > 0 && (
                <div className="space-y-2">
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Hints</h3>
                   {lab.hints.map((hint, i) => (
                      <div key={i} className="text-xs bg-slate-100 p-3 rounded text-slate-600 border border-slate-200">
                         {hint}
                      </div>
                   ))}
                </div>
              )}
              
              {successMsg && (
                 <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-xl border border-green-200 text-center animate-bounce-small shadow-md">
                    <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                    <p className="font-bold mb-2">{successMsg}</p>
                    <button onClick={onComplete} className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-green-700 shadow-lg hover:scale-105 transition-all">
                      Complete Module
                    </button>
                 </div>
              )}
           </div>
         )}

         {/* TUTOR TAB CONTENT */}
         {activeTab === 'TUTOR' && (
            <div className="flex-1 flex flex-col animate-slide-right">
               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                        }`}>
                            {msg.role === 'model' && <Bot size={14} className="inline mr-2 mb-0.5 text-blue-500" />}
                            {msg.content}
                        </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
               </div>
               <form onSubmit={handleChat} className="p-3 bg-white border-t border-slate-200 flex gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask for help..."
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <button type="submit" className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 shadow-md hover:scale-105 transition-all">
                    <Send size={18} />
                  </button>
               </form>
            </div>
         )}
      </div>

      {/* MAIN WORKSPACE: EDITOR & TERMINAL */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
         
         {/* EDITOR AREA (Takes mostly all space) */}
         {lab.labType === LabType.CODE_EDITOR && (
           <div className="flex-1 flex flex-col border-b border-black">
              <div className="h-10 bg-[#252526] flex items-center justify-between px-4 text-gray-400 text-xs border-b border-[#333]">
                 <span className="flex items-center gap-2 font-mono"><Book size={12} /> main.{lab.language === 'python' ? 'py' : 'java'}</span>
                 <button 
                   onClick={handleRunCode}
                   disabled={isProcessing}
                   className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                 >
                   {isProcessing ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div> : <Play size={12} />}
                   Run Code
                 </button>
              </div>
              <textarea 
                className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono p-4 resize-none focus:outline-none text-sm leading-6"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
              />
           </div>
         )}

         {/* TERMINAL / VISUALIZER AREA (Bottom split) */}
         <div className={`${lab.labType === LabType.CODE_EDITOR ? 'h-52' : 'flex-1'} bg-black border-t border-[#333] flex flex-col transition-all duration-300`}>
            {lab.labType === LabType.VISUALIZER ? (
               <div className="flex-1 flex flex-col p-4 bg-slate-50">
                  <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-2 mb-2">
                     {lab.visualData && <Visualizer data={lab.visualData} />}
                  </div>
                  <div className="h-32 bg-black rounded border border-gray-700 shadow-inner">
                     <Terminal lines={terminalLines} onCommand={handleTerminalCommand} isProcessing={isProcessing} />
                  </div>
               </div>
            ) : (
               <>
                 <div className="bg-[#252526] px-3 py-1 text-xs text-gray-400 flex items-center gap-2 border-b border-[#333]">
                    <TerminalIcon size={12} /> Console / Output
                 </div>
                 <div className="flex-1 overflow-hidden relative">
                    <Terminal lines={terminalLines} onCommand={handleTerminalCommand} isProcessing={isProcessing} />
                 </div>
               </>
            )}
         </div>
      </div>

    </div>
  );
};
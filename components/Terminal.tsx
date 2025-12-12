import React, { useState, useEffect, useRef } from 'react';
import { TerminalLine } from '../types';

interface TerminalProps {
  lines: TerminalLine[];
  onCommand: (cmd: string) => void;
  isProcessing: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ lines, onCommand, isProcessing }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    inputRef.current?.focus();
  }, [lines, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onCommand(input);
    setInput('');
  };

  return (
    <div className="bg-black text-green-400 font-mono p-4 h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-1">
        {lines.map((line, idx) => (
          <div key={idx} className={`${line.type === 'error' ? 'text-red-500' : line.type === 'system' ? 'text-blue-400' : 'text-green-400'} whitespace-pre-wrap break-words text-sm`}>
            {line.type === 'input' && <span className="text-pink-500 mr-2">$</span>}
            {line.content}
          </div>
        ))}
        {isProcessing && <div className="animate-pulse text-gray-500 text-sm">Processing...</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-2 flex items-center">
        <span className="text-pink-500 mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-gray-600 text-sm"
          placeholder="Type a command..."
          autoFocus
        />
      </form>
    </div>
  );
};
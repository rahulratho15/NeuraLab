import React, { useState, useEffect } from 'react';
import { Activity } from '../types';
import { Check, X, GripVertical, ArrowDown, Shuffle, RotateCw, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  activity: Activity;
  onComplete: () => void;
}

// --- MEMORY GAME ---
const MemoryGame: React.FC<Props> = ({ activity, onComplete }) => {
  const [cards, setCards] = useState<{ id: number; text: string; matched: boolean; flipped: boolean; uuid: number }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  
  useEffect(() => {
    if (!activity.pairs) return;
    // Create deck: double the pairs (front and back separate cards)
    const deck = activity.pairs.flatMap((pair, i) => [
      { id: i, text: pair.front, matched: false, flipped: false, uuid: Math.random() },
      { id: i, text: pair.back, matched: false, flipped: false, uuid: Math.random() }
    ]).sort(() => Math.random() - 0.5); // Shuffle
    setCards(deck);
  }, [activity]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const match = cards[newFlipped[0]].id === cards[newFlipped[1]].id;
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => {
          if (i === newFlipped[0] || i === newFlipped[1]) {
            return { ...c, flipped: match, matched: match };
          }
          return c;
        }));
        setFlippedIndices([]);
        
        // Check win
        const allMatched = cards.every(c => c.matched) || (match && cards.filter(c => !c.matched).length === 2);
        if (allMatched) onComplete();
      }, 1000);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {cards.map((card, idx) => (
        <button
          key={card.uuid}
          onClick={() => handleCardClick(idx)}
          className={`h-24 md:h-32 rounded-xl flex items-center justify-center p-2 text-sm font-bold shadow-sm transition-all duration-500 transform perspective-1000 active:scale-95 ${
            card.flipped || card.matched 
              ? 'bg-blue-600 text-white rotate-y-180 scale-100 shadow-blue-200' 
              : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-blue-400 hover:shadow-md'
          } ${card.matched ? 'animate-bounce-small opacity-50' : ''}`}
        >
          {card.flipped || card.matched ? (
              <span className="text-center">{card.text}</span>
          ) : (
              <RotateCw className="opacity-20" size={32} />
          )}
        </button>
      ))}
    </div>
  );
};

// --- SORTING GAME (FLOW BUILDER) ---
const SortingGame: React.FC<Props> = ({ activity, onComplete }) => {
  const [items, setItems] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  useEffect(() => {
    if (activity.steps) {
        // Shuffle initially
        setItems([...activity.steps].sort(() => Math.random() - 0.5));
    }
  }, [activity]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);
    setFeedback(null);
  };

  const checkOrder = () => {
    if (!activity.steps) return;
    const isCorrect = items.every((item, i) => item === activity.steps![i]);
    if (isCorrect) {
        setFeedback("Correct! The sequence is perfect.");
        onComplete();
    } else {
        setFeedback("Not quite right. Review the logic order.");
    }
  };

  return (
    <div className="space-y-3 max-w-lg mx-auto">
      <div className="text-center text-sm text-slate-500 mb-4 bg-slate-100 p-2 rounded border border-slate-200">
        Arrange the steps in the correct order from Top to Bottom
      </div>
      {items.map((item, idx) => (
        <div key={item} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-slide-up hover:shadow-md transition-all">
          <div className="flex flex-col gap-1 text-slate-400">
             <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-30 hover:scale-125 transition-transform">▲</button>
             <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="hover:text-blue-600 disabled:opacity-30 hover:scale-125 transition-transform">▼</button>
          </div>
          <div className="flex-1 font-medium text-slate-700">{item}</div>
          <div className="text-xs font-bold text-slate-300">STEP {idx + 1}</div>
        </div>
      ))}
      
      {feedback && (
          <div className={`text-center p-2 rounded text-sm font-bold ${feedback.includes("Correct") ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
              {feedback}
          </div>
      )}

      <button onClick={checkOrder} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
        Check Sequence
      </button>
    </div>
  );
};

// --- MATCHING GAME (CONCEPT BUILDER) ---
const MatchingGame: React.FC<Props> = ({ activity, onComplete }) => {
  const [terms, setTerms] = useState<string[]>([]);
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matches, setMatches] = useState<{term: string, def: string}[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activity.matchPairs) {
        setTerms(activity.matchPairs.map(p => p.term).sort(() => Math.random() - 0.5));
        setDefinitions(activity.matchPairs.map(p => p.definition).sort(() => Math.random() - 0.5));
    }
  }, [activity]);

  const handleTermClick = (term: string) => {
    if (matches.find(m => m.term === term)) return; // Already matched
    setSelectedTerm(term);
    setErrorMsg(null);
  };

  const handleDefClick = (def: string) => {
    if (matches.find(m => m.def === def)) return; // Already matched
    if (!selectedTerm) return;

    // Check if correct pair
    const correctPair = activity.matchPairs?.find(p => p.term === selectedTerm && p.definition === def);
    
    if (correctPair) {
        const newMatches = [...matches, { term: selectedTerm, def: def }];
        setMatches(newMatches);
        setSelectedTerm(null);
        setErrorMsg(null);
        if (newMatches.length === activity.matchPairs?.length) {
            onComplete();
        }
    } else {
        setErrorMsg("Incorrect match. Try again!");
        setTimeout(() => setErrorMsg(null), 1500);
        setSelectedTerm(null);
    }
  };

  return (
    <div className="space-y-4">
        {errorMsg && (
            <div className="text-center text-red-500 text-sm font-bold animate-pulse">
                <AlertCircle size={16} className="inline mr-1" /> {errorMsg}
            </div>
        )}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
                <h4 className="font-bold text-center text-slate-500 mb-2 text-xs uppercase tracking-wider">Terms</h4>
                {terms.map(term => {
                    const isMatched = matches.find(m => m.term === term);
                    const isSelected = selectedTerm === term;
                    return (
                        <button
                            key={term}
                            onClick={() => handleTermClick(term)}
                            disabled={!!isMatched}
                            className={`w-full p-4 rounded-xl text-left font-bold transition-all duration-300 ${
                                isMatched ? 'bg-green-50 text-green-700 border border-green-200 opacity-60 scale-95' :
                                isSelected ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300' :
                                'bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md'
                            }`}
                        >
                            {term} {isMatched && <Check size={16} className="inline ml-2 float-right"/>}
                        </button>
                    );
                })}
            </div>
            
            <div className="space-y-3">
                <h4 className="font-bold text-center text-slate-500 mb-2 text-xs uppercase tracking-wider">Definitions</h4>
                {definitions.map(def => {
                    const isMatched = matches.find(m => m.def === def);
                    return (
                        <button
                            key={def}
                            onClick={() => handleDefClick(def)}
                            disabled={!!isMatched}
                            className={`w-full p-4 rounded-xl text-left text-sm transition-all duration-300 ${
                                isMatched ? 'bg-green-50 text-green-700 border border-green-200 opacity-60 scale-95' :
                                'bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                            }`}
                        >
                            {def}
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

// --- MAIN WRAPPER ---
export const InteractiveActivity: React.FC<Props> = (props) => {
  const { activity } = props;
  
  if (activity.type === 'MEMORY') return <MemoryGame {...props} />;
  if (activity.type === 'SORTING') return <SortingGame {...props} />;
  if (activity.type === 'MATCHING') return <MatchingGame {...props} />;
  
  return null;
};
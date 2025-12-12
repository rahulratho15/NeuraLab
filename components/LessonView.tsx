import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LessonContent, LessonSection } from '../types';
import { Visualizer } from './Visualizer';
import { InteractiveActivity } from './InteractiveActivities';
import { BookOpen, Code, Play, Check, ChevronRight, AlertCircle, Sparkles, Youtube, Trophy, Gamepad2, Layers, ExternalLink } from 'lucide-react';

interface LessonViewProps {
  lesson: LessonContent;
  onStartLab: () => void;
  onNextModule: () => void;
  hasNextModule: boolean;
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, onStartLab, onNextModule, hasNextModule }) => {
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set());

  // Legacy quiz handling
  const [quizSelected, setQuizSelected] = useState<{[key: number]: number}>({});
  const [quizFeedback, setQuizFeedback] = useState<{[key: number]: { correct: boolean; message: string }}>({});

  const handleQuizSubmit = (sectionIdx: number, optionIdx: number, activity: any) => {
    if (!activity || activity.type !== 'QUIZ') return;
    
    setQuizSelected(prev => ({ ...prev, [sectionIdx]: optionIdx }));
    
    // Check correct answer. 
    // Handle case where options are objects with isCorrect property (AI inconsistency fix)
    let isCorrect = false;
    const selectedOption = activity.options[optionIdx];
    
    if (typeof selectedOption === 'object' && selectedOption !== null && 'isCorrect' in selectedOption) {
        isCorrect = selectedOption.isCorrect;
    } else {
        isCorrect = optionIdx === activity.correctAnswer;
    }

    setQuizFeedback(prev => ({
      ...prev,
      [sectionIdx]: {
        correct: isCorrect,
        message: isCorrect ? "Correct! " + (activity.explanation || "Great job.") : "Incorrect. Try again."
      }
    }));

    if (isCorrect) {
        setCompletedActivities(prev => new Set(prev).add(sectionIdx));
    }
  };

  const handleActivityComplete = (sectionIdx: number) => {
    setCompletedActivities(prev => new Set(prev).add(sectionIdx));
  };

  // Safe render helper for options that might be objects
  const renderOptionText = (opt: any) => {
    if (typeof opt === 'object' && opt !== null && opt.text) {
        return opt.text;
    }
    return String(opt);
  };

  const progressPercentage = (completedActivities.size / (lesson.sections.filter(s => s.activity).length || 1)) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 p-4 max-w-5xl mx-auto">
      
      {/* Header with Progress */}
      <div className="bg-white/90 p-6 rounded-2xl border border-white/20 shadow-lg sticky top-0 z-20 backdrop-blur-xl animate-scale-in">
        <div className="flex justify-between items-end mb-3">
             <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <BookOpen size={24} />
                </div>
                {lesson.title}
            </h1>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {Math.round(progressPercentage)}% Complete
            </span>
        </div>
        
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
             <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${progressPercentage}%` }}
             >
                <div className="absolute inset-0 bg-white/30 w-full animate-shimmer"></div>
             </div>
        </div>
      </div>

      {/* Continuous Content Scroll */}
      <div className="flex-1 overflow-y-auto rounded-2xl space-y-12 pb-20 pr-2 scroll-smooth">
        
        {lesson.sections.map((section, idx) => (
          <div 
            key={idx} 
            style={{ animationDelay: `${idx * 150}ms` }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden group animate-slide-up hover:shadow-md transition-shadow duration-300"
          >
            {/* Section Decoration */}
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-blue-500 transition-colors duration-500"></div>
            
            <h2 className="text-3xl font-bold text-slate-800 mb-6 pl-4">{section.title}</h2>
            
            {/* 1. Image */}
            {section.imageUrl && (
                <div className="mb-8 rounded-xl overflow-hidden shadow-md border border-slate-100 group-hover:scale-[1.01] transition-transform duration-700">
                    <img src={section.imageUrl} alt={section.title} className="w-full h-64 object-cover" />
                </div>
            )}

            {/* 2. Video Link */}
            {section.videoSearchTerm && (
              <div className="mb-8 px-4">
                 <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(section.videoSearchTerm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group/video cursor-pointer"
                 >
                    <div className="flex items-center gap-4">
                        <div className="bg-red-600 text-white p-4 rounded-full shadow-lg group-hover/video:scale-110 transition-transform">
                            <Youtube size={24} fill="white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 group-hover/video:text-red-700 transition-colors">Watch Video Tutorial</h3>
                            <p className="text-slate-500 text-sm">Click to search for "{section.videoSearchTerm}" on YouTube</p>
                        </div>
                    </div>
                    <ExternalLink className="text-slate-300 group-hover/video:text-red-500 transition-colors" size={20} />
                 </a>
              </div>
            )}

            {/* 3. Main Text Content */}
            <div className="prose prose-lg prose-slate prose-headings:font-bold prose-h3:text-2xl prose-p:leading-relaxed prose-code:text-blue-600 prose-pre:bg-slate-900 prose-pre:text-green-400 max-w-none mb-8 px-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                </ReactMarkdown>
            </div>

            {/* 4. Interactive Visualization */}
            {section.visualData && (
              <div className="mb-8 px-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                    <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-500 animate-pulse" /> Interactive Model
                    </h3>
                    <Visualizer data={section.visualData} />
                </div>
              </div>
            )}

            {/* 5. Code Block */}
            {section.codeExample && (
              <div className="mb-8 mx-4 bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                <div className="bg-[#2d2d2d] px-4 py-2 text-xs text-slate-400 flex items-center gap-2 font-mono border-b border-[#3e3e3e]">
                   <Code size={14} /> {section.language || 'Code'}
                </div>
                <pre className="p-4 text-sm font-mono text-green-400 overflow-x-auto custom-scrollbar">
                  {section.codeExample}
                </pre>
              </div>
            )}

            {/* 6. Integrated Activity */}
            {section.activity && (
               <div className="mt-8 mx-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-6 shadow-inner relative overflow-hidden">
                   {/* Background pattern */}
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <Gamepad2 size={120} />
                   </div>

                   <div className="flex items-center justify-between mb-6 relative z-10">
                      <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <Gamepad2 className="text-indigo-600" /> 
                        {section.activity.title || 'Knowledge Check'}
                      </h3>
                      {completedActivities.has(idx) && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-scale-in">
                              <Trophy size={14} /> Complete
                          </span>
                      )}
                   </div>

                   {/* Legacy Quiz Render */}
                   {section.activity.type === 'QUIZ' && section.activity.question && section.activity.options && (
                      <div className="relative z-10">
                        <p className="text-lg text-slate-800 font-medium mb-4">{section.activity.question}</p>
                        <div className="grid gap-3">
                            {section.activity.options.map((opt: any, optIdx: number) => (
                            <button
                                key={optIdx}
                                onClick={() => handleQuizSubmit(idx, optIdx, section.activity)}
                                disabled={quizFeedback[idx]?.correct}
                                className={`p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between group ${
                                    quizSelected[idx] === optIdx 
                                    ? quizFeedback[idx]?.correct 
                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-md' 
                                        : 'bg-red-50 border-red-500 text-red-700'
                                    : 'bg-white border-white hover:border-blue-200 shadow-sm hover:shadow-md hover:translate-x-1'
                                }`}
                            >
                                <span className="font-medium">{renderOptionText(opt)}</span>
                                {quizSelected[idx] === optIdx && (
                                quizFeedback[idx]?.correct ? <Check size={20} className="animate-scale-in"/> : <span className="text-red-500 font-bold animate-scale-in">✕</span>
                                )}
                            </button>
                            ))}
                        </div>
                        {quizFeedback[idx] && (
                             <div className={`mt-4 p-3 rounded-lg text-center font-bold text-sm animate-fade-in ${quizFeedback[idx].correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {quizFeedback[idx].message}
                             </div>
                        )}
                      </div>
                  )}

                  {/* New Activities Render */}
                  {section.activity.type !== 'QUIZ' && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white p-2 relative z-10">
                         <InteractiveActivity activity={section.activity} onComplete={() => handleActivityComplete(idx)} />
                      </div>
                  )}
                  
                  {completedActivities.has(idx) && section.activity.explanation && section.activity.type !== 'QUIZ' && (
                       <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center font-medium text-sm animate-slide-up">
                           {section.activity.explanation}
                       </div>
                  )}
               </div>
            )}
          </div>
        ))}

        {/* Action Buttons Footer */}
        <div className="grid md:grid-cols-2 gap-4 pt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <button
                onClick={onStartLab}
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
                <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-400 transition-colors">Ready to practice?</div>
                    <div className="text-lg">Start Lab Simulation</div>
                </div>
                <div className="bg-white/10 p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <Code size={24} />
                </div>
            </button>

            {hasNextModule && (
                <button
                    onClick={onNextModule}
                    className={`group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-1 transition-all ${progressPercentage >= 100 ? 'animate-pulse-slow' : ''}`}
                >
                     <div>
                        <div className="text-xs text-blue-100 uppercase tracking-wider mb-1">Keep learning</div>
                        <div className="text-lg">Next Module</div>
                    </div>
                     <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors group-hover:translate-x-1">
                        <ChevronRight size={24} />
                    </div>
                </button>
            )}
        </div>

      </div>
    </div>
  );
};
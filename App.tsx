import React, { useState, useEffect } from 'react';
import { Brain, ChevronRight, Terminal as TerminalIcon, Code, Activity, Search, Sparkles, BookOpen, Layers, Zap, GraduationCap, ArrowRight, PlayCircle, History, Star, Bot, CheckCircle, Layout, Cpu } from 'lucide-react';
import { Screen, Course, Module, LabState, LabType, LessonContent } from './types';
import { generateCourse, generateLab, generateLesson, generatePracticeLab } from './services/geminiService';
import { LabEnvironment } from './components/LabEnvironment';
import { LessonView } from './components/LessonView';

const App = () => {
  const [screen, setScreen] = useState<Screen>(Screen.HOME);
  const [topic, setTopic] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonContent | null>(null);
  const [activeLab, setActiveLab] = useState<LabState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  // --- Persistence Logic ---
  useEffect(() => {
    // Load from local storage on mount
    const savedData = localStorage.getItem('neuroLabState');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.course) {
             setCourse(parsed.course);
        }
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save state on change
    if (course) {
      localStorage.setItem('neuroLabState', JSON.stringify({ course }));
    }
  }, [course]);

  const handleStartCourse = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setLoadingMsg('Designing Your Curriculum...');
    setError('');
    try {
      const generatedCourse = await generateCourse(topic);
      setCourse(generatedCourse);
      setScreen(Screen.CURRICULUM);
    } catch (err) {
      setError('Failed to generate course. Please ensure API Key is valid and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueCourse = () => {
     if (course) setScreen(Screen.CURRICULUM);
  };

  const handleQuickPractice = async () => {
    if (!topic.trim()) {
        setError("Please enter a topic first.");
        return;
    }

    setLoading(true);
    setLoadingMsg('Spinning up Practice Environment...');
    setError('');
    setCourse(null);
    setCurrentModule(null);

    try {
      const lab = await generatePracticeLab(topic);
      setActiveLab(lab);
      setScreen(Screen.LAB);
    } catch (err) {
      setError('Failed to create practice lab. Please try a different topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleSelect = async (module: Module) => {
    setLoading(true);
    setLoadingMsg(`Generating Interactive Lesson: ${module.title}...`);
    setCurrentModule(module);
    try {
      const lesson = await generateLesson(module.title, course!.topic);
      setActiveLesson(lesson);
      setScreen(Screen.LESSON);
    } catch (err) {
      setError('Could not generate lesson content.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLabFromLesson = async () => {
    if (!currentModule || !course) return;
    
    setLoading(true);
    setLoadingMsg('Initializing Simulation Sandbox...');
    try {
      const labData = await generateLab(currentModule.title, course.topic, currentModule.labType);
      setActiveLab(labData);
      setScreen(Screen.LAB);
    } catch (err) {
      setError('Could not load lab environment.');
    } finally {
      setLoading(false);
    }
  };

  const handleLabComplete = () => {
    if (course && currentModule) {
        // Mark module as complete
        const updatedModules = course.modules.map(m => 
            m.id === currentModule.id ? { ...m, isCompleted: true } : m
        );
        setCourse({ ...course, modules: updatedModules });
        setScreen(Screen.CURRICULUM);
    } else {
        setScreen(Screen.HOME);
    }
    setActiveLab(null);
    setActiveLesson(null);
  };

  const handleNextModule = () => {
     if (!course || !currentModule) return;
     const currentIndex = course.modules.findIndex(m => m.id === currentModule.id);
     if (currentIndex >= 0 && currentIndex < course.modules.length - 1) {
         handleModuleSelect(course.modules[currentIndex + 1]);
     } else {
         setScreen(Screen.CURRICULUM);
     }
  };

  const hasNextModule = () => {
     if (!course || !currentModule) return false;
     const currentIndex = course.modules.findIndex(m => m.id === currentModule.id);
     return currentIndex < course.modules.length - 1;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="border-b border-white/50 bg-white/70 backdrop-blur-lg sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setScreen(Screen.HOME)}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Brain className="text-white" size={24} />
            </div>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all">
              NeuroLab<span className="text-blue-600 group-hover:text-indigo-600">.AI</span>
            </span>
          </div>
          
          {course && (
             <div className="hidden md:flex items-center gap-4 text-sm text-slate-500 font-medium animate-fade-in">
                <span>Course: <span className="text-blue-600 font-bold">{course.topic}</span></span>
                <div className="h-4 w-px bg-slate-300"></div>
                {screen === Screen.LESSON && <span className="text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100"><BookOpen size={14} /> Learning Phase</span>}
                {screen === Screen.LAB && <span className="text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-100"><Activity size={14} /> Lab Simulation</span>}
             </div>
          )}
        </div>
      </nav>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[60] flex items-center justify-center flex-col gap-6 animate-fade-in">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-t-4 border-indigo-500 rounded-full animate-spin [animation-direction:reverse]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="text-slate-400 animate-pulse" size={40} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl text-slate-800 font-bold animate-pulse text-glow">{loadingMsg}</p>
            <p className="text-slate-500 font-medium">Using Google Gemini 2.0 Flash to generate personalized content...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full">
        {screen === Screen.HOME && (
          <div className="relative w-full overflow-hidden">
             {/* Hero Section - Full Viewport */}
             <div className="relative min-h-[calc(100vh-64px)] flex flex-col justify-center bg-slate-50">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                
                {/* Animated Background Blobs */}
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px] animate-blob"></div>
                <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500 opacity-20 blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute left-10 bottom-20 -z-10 h-[200px] w-[200px] rounded-full bg-purple-400 opacity-20 blur-[80px] animate-float"></div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10 py-12">
                    
                    {/* Left Content (Span 7) */}
                    <div className="lg:col-span-7 text-left space-y-8 animate-slide-up">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-200 flex items-center gap-2 animate-bounce-small">
                                <Activity size={16} /> {error}
                            </div>
                        )}

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-transform cursor-default">
                            <Sparkles size={14} className="text-yellow-500" /> 
                            <span>AI-Powered Adaptive Learning v2.0</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                            Master any skill. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Build your future.
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                            NeuroLab generates personalized, interactive courses instantly. 
                            Choose a comprehensive <strong>structured path</strong> or jump straight into a <strong>hands-on lab</strong>.
                        </p>

                        {/* Search / Input Action Area */}
                        <div className="relative max-w-lg z-20 space-y-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                                <div className="relative flex items-center bg-white rounded-xl p-2 shadow-2xl ring-1 ring-slate-100">
                                    <Search className="ml-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                                    <input 
                                    type="text" 
                                    placeholder="What do you want to learn? (e.g. React Hooks)" 
                                    className="w-full bg-transparent border-none text-slate-900 px-4 py-3 focus:outline-none text-lg placeholder-slate-400 font-medium"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleStartCourse();
                                    }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={(e) => handleStartCourse(e)}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 font-bold group"
                                >
                                    <BookOpen size={20} className="text-slate-300 group-hover:text-white transition-colors" />
                                    Generate Course
                                </button>
                                <button 
                                    onClick={handleQuickPractice}
                                    className="flex-1 bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-700 hover:text-blue-600 px-6 py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-bold group"
                                >
                                    <TerminalIcon size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    Instant Lab
                                </button>
                            </div>
                            
                            {course && (
                                <div className="pt-2 animate-fade-in flex justify-center sm:justify-start">
                                    <button onClick={handleContinueCourse} className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                                        <History size={14} /> Resume: <span className="font-bold underline">{course.topic}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions / Popular */}
                        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 pt-2 items-center">
                            <span className="text-slate-400">Popular:</span>
                            {['Docker', 'Rust', 'Neuroscience', 'Calculus'].map(t => (
                                <button key={t} onClick={() => setTopic(t)} className="px-3 py-1 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Content (Visual) (Span 5) */}
                    <div className="lg:col-span-5 relative hidden lg:block animate-slide-left perspective-1000">
                        {/* Main Card */}
                        <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-6 transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out group">
                            {/* Mock UI Header */}
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="ml-auto text-xs text-slate-400 font-mono flex items-center gap-1">
                                    <Cpu size={12}/> AI_Tutor_Core_v2.1
                                </div>
                            </div>
                            {/* Mock Content */}
                            <div className="space-y-4">
                                <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-3 group-hover:bg-blue-50/30 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Bot size={16}/></div>
                                        <div className="h-2 w-24 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-slate-200 rounded"></div>
                                        <div className="h-2 w-4/5 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1 h-32 bg-[#1e1e1e] rounded-xl p-3 font-mono text-[10px] text-gray-300 leading-relaxed overflow-hidden relative shadow-inner">
                                         <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                         <div className="opacity-80">
                                            <span className="text-purple-400">async function</span> <span className="text-yellow-300">learn</span>(topic) {'{'} <br/>
                                            &nbsp;&nbsp;<span className="text-purple-400">const</span> path = <span className="text-blue-400">await</span> gen(topic);<br/>
                                            &nbsp;&nbsp;<span className="text-purple-400">return</span> <span className="text-green-300">"mastery"</span>;<br/>
                                            {'}'}
                                         </div>
                                    </div>
                                    <div className="w-24 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-2">
                                        <Activity className="text-blue-500 animate-pulse" />
                                        <div className="h-1 w-8 bg-blue-200 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Cards */}
                        <div className="absolute -top-12 -right-8 bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 animate-float-delayed z-20">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Skill Level</div>
                                    <div className="text-lg font-bold text-slate-800">Advanced</div>
                                </div>
                            </div>
                        </div>

                         <div className="absolute -bottom-8 -left-12 bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 animate-float z-20">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                                    <Brain size={24} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Curriculum</div>
                                    <div className="text-sm font-bold text-slate-800">Generated in 1.2s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
             
             {/* Feature Strip (Now Sibling to Hero) */}
             <div className="w-full bg-white border-y border-slate-200 py-20 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Why NeuroLab?</h2>
                            <h3 className="text-3xl font-bold text-slate-900">Reinventing how you learn technical skills</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Layers, title: "Structured Curriculums", desc: "AI generates step-by-step modules tailored to your exact expertise level and goals." },
                            { icon: Code, title: "Hands-on Practice", desc: "Don't just read. Write code, execute terminal commands, and debug in a secure sandbox." },
                            { icon: Activity, title: "Visual Understanding", desc: "Interactive graphs and dynamic diagrams help you grasp abstract concepts intuitively." }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group cursor-default">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4 border border-slate-200 group-hover:border-blue-600">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-2">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
             
             {/* Simple Footer */}
             <footer className="bg-slate-50 py-12 text-center text-slate-400 text-sm border-t border-slate-200">
                 <div className="flex items-center justify-center gap-2 mb-4 opacity-70 hover:opacity-100 transition-opacity">
                     <Brain size={20} className="text-slate-400"/>
                     <span className="font-bold text-slate-600">NeuroLab AI</span>
                 </div>
                 <p>&copy; {new Date().getFullYear()} Adaptive Learning Platform. Powered by Google Gemini 2.0.</p>
             </footer>
          </div>
        )}

        {/* Screen: CURRICULUM */}
        {screen === Screen.CURRICULUM && course && (
          <div className="animate-fade-in max-w-7xl mx-auto px-6 py-8">
            <header className="mb-8 animate-slide-up">
                <button onClick={() => setScreen(Screen.HOME)} className="text-slate-500 hover:text-blue-600 mb-4 text-sm font-medium flex items-center gap-1 transition-colors group">
                    <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={16} /> Back to Search
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-blue-200">Structured Course</span>
                        </div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-3">{course.topic}</h2>
                        <p className="text-slate-500 max-w-3xl leading-relaxed text-lg">{course.overview}</p>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
              {course.modules.map((mod, index) => (
                <div 
                  key={mod.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleModuleSelect(mod)}
                  className={`group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col animate-slide-up ${mod.isCompleted ? 'border-green-200 shadow-md bg-green-50/10' : 'border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-2'}`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-500 ${mod.isCompleted ? 'bg-green-500' : 'bg-gradient-to-b from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100'}`}></div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 shadow-sm ${mod.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg'}`}>
                        {mod.labType === LabType.TERMINAL && <TerminalIcon size={24} />}
                        {mod.labType === LabType.CODE_EDITOR && <Code size={24} />}
                        {mod.labType === LabType.VISUALIZER && <Activity size={24} />}
                        {mod.labType === LabType.QUIZ && <Brain size={24} />}
                      </div>
                      {mod.isCompleted && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 border border-green-200"><Star size={12} fill="currentColor"/> Complete</span>}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {index + 1}. {mod.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm group-hover:border-blue-100 transition-colors">
                       <span className="text-slate-400 font-medium flex items-center gap-1"><GraduationCap size={14}/> {mod.estimatedTime}</span>
                       <span className="text-blue-600 font-bold flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 gap-1">
                           {mod.isCompleted ? 'Review' : 'Start'} <ChevronRight size={16} />
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screen: LESSON */}
        {screen === Screen.LESSON && activeLesson && (
           <div className="animate-fade-in w-full">
              <div className="max-w-7xl mx-auto px-6 py-4">
                  <button onClick={() => setScreen(Screen.CURRICULUM)} className="text-slate-500 hover:text-blue-600 mb-4 text-sm flex items-center gap-1 font-medium transition-colors group">
                     <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={16}/> Back to Curriculum
                  </button>
              </div>
              <LessonView 
                 lesson={activeLesson} 
                 onStartLab={handleStartLabFromLesson}
                 onNextModule={handleNextModule}
                 hasNextModule={hasNextModule()}
              />
           </div>
        )}

        {/* Screen: LAB */}
        {screen === Screen.LAB && activeLab && (
            <div className="animate-scale-in w-full h-[calc(100vh-64px)] overflow-hidden">
                <div className="bg-slate-50 h-full flex flex-col">
                    <div className="px-6 py-2 border-b border-slate-200 bg-white flex items-center shadow-sm z-10">
                        <button onClick={() => setScreen(course ? Screen.LESSON : Screen.HOME)} className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1 font-medium transition-colors">
                             <ChevronRight className="rotate-180" size={16}/> {course ? 'Back to Lesson' : 'Exit Practice'}
                        </button>
                        <div className="mx-4 h-4 w-px bg-slate-200"></div>
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            {activeLab.title}
                        </span>
                    </div>
                    <LabEnvironment lab={activeLab} onComplete={handleLabComplete} />
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
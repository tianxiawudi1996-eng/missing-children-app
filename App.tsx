import React, { useState, useEffect } from 'react';
import { AppStep, GenerationResult, GenerationOptions, HistoryItem } from './types';
import InputStep from './components/InputStep';
import ConfirmationStep from './components/ConfirmationStep';
import ResultsStep from './components/ResultsStep';
import PreviewPanel from './components/PreviewPanel';
import HistorySidebar from './components/HistorySidebar';
import { generateContent, validateApiKey } from './services/geminiService';
import { Music, Layout, ChevronRight, Edit3, MonitorPlay, Eye, EyeOff, Sparkles, Zap, History, Settings, Key, X, AlertCircle, CheckCircle, Loader2, Wifi, Smartphone, Globe, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [draftText, setDraftText] = useState(''); 
  const [sourceText, setSourceText] = useState('');
  
  // Single screen navigation: 'editor' or 'preview'
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  
  // Studio Settings State
  const [options, setOptions] = useState<any>(null);
  
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // API Key & Settings State
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'key' | 'deploy'>('key'); // Tab state for Settings
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('missing_children_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    // Load API Key from local storage if available
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveToHistory = (data: GenerationResult, source: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      data,
      sourceText: source
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('missing_children_history', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 기록을 삭제하시겠습니까?")) return;
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('missing_children_history', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResults(item.data);
    setSourceText(item.sourceText);
    setDraftText(item.sourceText); // Restore input text as well
    setStep(AppStep.RESULTS);
    setActiveView('editor'); // Go to results view in editor
    setIsHistoryOpen(false);
  };

  const handleInputNext = (data: any) => {
    setSourceText(draftText);
    setOptions(data);
    setStep(AppStep.CONFIRMATION);
  };

  const handleConfirm = async () => {
    setStep(AppStep.GENERATING);
    setError(null);
    
    // Check for API key preference order: Manual Key -> Environment Key -> AI Studio Auto Key
    if (!apiKey && !process.env.API_KEY) {
       // Only try to use window.aistudio if explicitly no other key is found
       try {
         const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
         if (hasKey === false) {
            await (window as any).aistudio.openSelectKey();
         }
       } catch (e) {
         // Ignore error if aistudio object is not present (e.g. deployed version)
       }
    }

    try {
      const fullOptions: GenerationOptions = {
        apiKey: apiKey, // Pass the manually set key
        sourceText,
        manualMusicStyle: options.manualMusicStyle,
        autoGenerateImages: options.autoGenerateImages,
        aspectRatio: options.aspectRatio,
        visualSettings: options.visualSettings,
        musicSettings: options.musicSettings,
        referenceImages: options.referenceImages
      };
      
      const data = await generateContent(fullOptions);
      saveToHistory(data, sourceText); // Auto-save to history
      
      setResults(data);
      setStep(AppStep.RESULTS);
      setActiveView('preview'); // Auto-switch to preview on completion
    } catch (err: any) {
      console.error(err);
      setError(err.message || "오류가 발생했습니다. API 키를 확인해주세요.");
      setStep(AppStep.CONFIRMATION);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setIsSettingsOpen(false);
    setTestStatus('idle'); // Reset test status on close
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestStatus('error');
      setTestMessage("API Key를 입력해주세요.");
      return;
    }
    setTestStatus('testing');
    try {
      await validateApiKey(apiKey);
      setTestStatus('success');
      setTestMessage("연결 성공! (Connected)");
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(e.message || "연결 실패. 키를 확인해주세요.");
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-gray-100 font-sans break-keep flex flex-col overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Header with Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0 z-20 shadow-lg px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl text-white shadow-blue-900/20 shadow-lg"><Sparkles size={18} /></div>
          <div>
            <h1 className="text-base font-black text-white leading-none">AI SUPPORT STUDIO</h1>
            <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">SMARTPHONE UI MODE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
             <button 
               onClick={() => setActiveView('editor')} 
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeView === 'editor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <Edit3 size={14} /> EDITOR
             </button>
             <button 
               onClick={() => setActiveView('preview')} 
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeView === 'preview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <MonitorPlay size={14} /> PREVIEW
             </button>
           </div>
           
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className={`w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors ${apiKey ? 'text-blue-400' : 'text-slate-400'}`}
             title="API Key 설정"
           >
             <Settings size={18} />
           </button>

           <button 
             onClick={() => setIsHistoryOpen(true)}
             className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
             title="히스토리"
           >
             <History size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-slate-950">
        {/* Editor View */}
        <div className={`absolute inset-0 transition-transform duration-500 p-4 lg:p-8 overflow-y-auto ${activeView === 'editor' ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="max-w-xl mx-auto pb-24">
            {step === AppStep.INPUT && <InputStep value={draftText} onChange={setDraftText} onNext={handleInputNext} apiKey={apiKey} />}
            {step === AppStep.CONFIRMATION && <ConfirmationStep onConfirm={handleConfirm} onEdit={() => setStep(AppStep.INPUT)} />}
            {step === AppStep.GENERATING && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="relative mb-12">
                   <div className="w-24 h-24 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center"><Zap size={32} className="text-blue-500 animate-pulse" /></div>
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tighter">STUDIO PRODUCTION</h3>
                <div className="space-y-4 max-w-xs mx-auto">
                   <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-400 font-bold mb-1">CURRENT STATUS</p>
                      <p className="text-sm text-blue-400 font-black">AI가 10~20장의 고유한 시퀀스를 렌더링하고 있습니다...</p>
                   </div>
                </div>
              </div>
            )}
            {step === AppStep.RESULTS && results && <ResultsStep data={results} onReset={() => setStep(AppStep.INPUT)} />}
            
            {/* Improved Error Display */}
            {error && (
              <div className="mt-6 p-5 bg-red-900/10 text-red-400 border border-red-900/20 rounded-3xl text-xs font-bold flex flex-col gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
                {(error.includes("API Key") || error.includes("API_KEY")) && (
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="self-start px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg"
                  >
                    API Key 설정 열기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview View */}
        <div className={`absolute inset-0 transition-transform duration-500 p-4 lg:p-8 overflow-y-auto bg-slate-950 ${activeView === 'preview' ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>
          <div className="max-w-xl mx-auto h-full relative z-10 pb-24">
             <PreviewPanel step={step} text={step === AppStep.INPUT ? draftText : sourceText} results={results} />
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        onSelect={loadHistoryItem}
        onDelete={deleteHistoryItem}
      />

      {/* Settings Modal (API Key & Deployment) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
             <button onClick={() => { setIsSettingsOpen(false); setTestStatus('idle'); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
             
             {/* Header */}
             <div className="flex items-center gap-3 mb-6">
               <div className="bg-blue-600/20 text-blue-500 p-3 rounded-xl"><Settings size={24}/></div>
               <div>
                  <h2 className="text-xl font-black text-white leading-none">Settings</h2>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Configuration & Deploy</p>
               </div>
             </div>

             {/* Tab Switcher */}
             <div className="flex p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
               <button 
                 onClick={() => setSettingsTab('key')} 
                 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'key' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 API Key 연결
               </button>
               <button 
                 onClick={() => setSettingsTab('deploy')} 
                 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'deploy' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 스마트폰/배포
               </button>
             </div>
             
             {settingsTab === 'key' ? (
               <div className="space-y-4 animate-fadeIn">
                 <div>
                    <label className="text-xs font-black text-slate-400 uppercase mb-2 block flex items-center gap-2">
                      <Key size={14} /> Gemini API Key
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        placeholder="Enter your Google Gemini API Key"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          if (testStatus !== 'idle') setTestStatus('idle');
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                      />
                      <button 
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing' || !apiKey}
                        className={`px-4 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${
                          testStatus === 'success' ? 'bg-green-600/20 text-green-500 border-green-500/50' :
                          testStatus === 'error' ? 'bg-red-600/20 text-red-500 border-red-500/50' :
                          'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {testStatus === 'testing' ? <Loader2 size={16} className="animate-spin"/> : <Wifi size={16}/>}
                        {testStatus === 'testing' ? 'TESTING...' : 'TEST'}
                      </button>
                    </div>
                    
                    {testStatus === 'success' && (
                      <p className="mt-2 text-[11px] font-bold text-green-500 flex items-center gap-1.5 animate-fadeIn">
                        <CheckCircle size={12}/> {testMessage}
                      </p>
                    )}
                    {testStatus === 'error' && (
                      <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1.5 animate-fadeIn">
                        <AlertCircle size={12}/> {testMessage}
                      </p>
                    )}
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-800 flex items-center justify-center">
                      GET API KEY
                    </a>
                    <button onClick={() => handleSaveApiKey(apiKey)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/30">
                      SAVE & CLOSE
                    </button>
                 </div>
               </div>
             ) : (
               <div className="space-y-5 animate-fadeIn">
                 <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start gap-3">
                       <Smartphone size={20} className="text-blue-500 mt-1"/>
                       <div>
                          <h4 className="text-sm font-bold text-white mb-1">모바일에서 사용하기</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            이 앱은 현재 개발 환경(Preview)에서 실행 중입니다. 
                            스마트폰에서 접속하려면 <span className="text-white font-bold">Vercel</span> 등에 배포해야 합니다.
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DEPLOYMENT STEPS</h4>
                    <StepItem num="1" text="현재 코드를 다운로드하거나 GitHub에 업로드하세요." />
                    <StepItem num="2" text="Vercel.com에 접속하여 'Add New Project'를 클릭하세요." />
                    <StepItem num="3" text="GitHub 레포지토리를 연결하고 'Deploy' 버튼을 누르세요." />
                    <StepItem num="4" text="생성된 URL 주소(예: my-app.vercel.app)를 복사하세요." />
                    <StepItem num="5" text="스마트폰 브라우저에 URL을 입력하고 API Key를 설정하세요." />
                 </div>

                 <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="w-full py-4 bg-black border border-slate-800 hover:border-white text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all group">
                   <Globe size={16}/> Vercel 배포하러 가기 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                 </a>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Progress Status Bar (Bottom) */}
      <footer className="bg-slate-900 border-t border-slate-800 h-10 px-4 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${step === AppStep.GENERATING ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span>STEP: {step}</span>
         </div>
         <div className="flex items-center gap-4">
            <span className={apiKey ? "text-blue-500" : "text-slate-600"}>{apiKey ? "CUSTOM API KEY" : "DEV ENVIRONMENT"}</span>
            <span>GEMINI 3 PRO ENGINE</span>
         </div>
      </footer>
    </div>
  );
};

const StepItem = ({ num, text }: { num: string, text: string }) => (
  <div className="flex gap-3 items-start">
    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">{num}</div>
    <p className="text-xs text-slate-400 leading-snug">{text}</p>
  </div>
);

export default App;
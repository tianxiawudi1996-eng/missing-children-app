
import React, { useState, useEffect } from 'react';
import { AppStep, GenerationResult, GenerationOptions, HistoryItem } from './types';
import InputStep from './components/InputStep';
import ConfirmationStep from './components/ConfirmationStep';
import ResultsStep from './components/ResultsStep';
import PreviewPanel from './components/PreviewPanel';
import HistorySidebar from './components/HistorySidebar';
import { generateContent, validateApiKey } from './services/geminiService';
import { Edit3, MonitorPlay, Settings, Key, X, AlertCircle, CheckCircle, Loader2, Dog, History, Heart, PawPrint, Sparkles, Clock, Save } from 'lucide-react';

// Use local interface and casting to avoid global namespace conflicts
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [draftText, setDraftText] = useState(''); 
  const [sourceText, setSourceText] = useState('');
  
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  
  const [options, setOptions] = useState<any>(null);
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  // State for Manual API Key Input (Deployed Environment)
  const [customKey, setCustomKey] = useState('');
  const [isAIStudioEnv, setIsAIStudioEnv] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const aiStudio = (window as any).aistudio as AIStudio | undefined;
      
      if (aiStudio) {
        setIsAIStudioEnv(true);
        const selected = await aiStudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Deployed Environment: Check LocalStorage or Env
        setIsAIStudioEnv(false);
        const localKey = localStorage.getItem('gemini_api_key');
        if (localKey || process.env.API_KEY) {
          setHasKey(true);
          setCustomKey(localKey || '');
        }
      }
    };
    checkKey();

    const saved = localStorage.getItem('pet_reunion_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
        localStorage.removeItem('pet_reunion_history');
      }
    }
  }, []);

  const saveToHistory = (data: GenerationResult, source: string) => {
    // CRITICAL: Strip base64 images before saving to localStorage to avoid QuotaExceededError
    const textOnlyResult = {
      ...data,
      imagePrompts: data.imagePrompts.map(prompt => ({
        ...prompt,
        generatedImage: undefined 
      }))
    };

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      data: textOnlyResult,
      sourceText: source
    };
    
    try {
      const updated = [newItem, ...history].slice(0, 30);
      setHistory(updated);
      localStorage.setItem('pet_reunion_history', JSON.stringify(updated));
    } catch (e) {
      console.error("Storage full even after stripping images", e);
      setError("저장 공간이 부족합니다. 오래된 히스토리를 삭제해주세요.");
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("정말 삭제할까요? 🐶")) return;
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('pet_reunion_history', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResults(item.data);
    setSourceText(item.sourceText);
    setDraftText(item.sourceText);
    setStep(AppStep.RESULTS);
    setActiveView('editor');
    setIsHistoryOpen(false);
  };

  const handleInputNext = (data: any) => {
    setSourceText(draftText);
    setOptions(data);
    setStep(AppStep.CONFIRMATION);
  };

  const handleOpenKeyDialog = async () => {
    const aiStudio = (window as any).aistudio as AIStudio | undefined;
    if (aiStudio) {
      await aiStudio.openSelectKey();
      setHasKey(true);
      setIsSettingsOpen(false);
    } else {
      // Open manual settings for deployed app
      setIsSettingsOpen(true);
    }
  };

  const handleSaveCustomKey = async () => {
    if (!customKey.trim()) {
      alert("API 키를 입력해주세요.");
      return;
    }
    
    // Temporarily save to test validation
    localStorage.setItem('gemini_api_key', customKey.trim());
    
    try {
      const isValid = await validateApiKey();
      if (isValid) {
        setHasKey(true);
        setIsSettingsOpen(false);
        alert("API 키가 성공적으로 저장되었습니다!");
      } else {
        throw new Error("Invalid Key");
      }
    } catch (e) {
      localStorage.removeItem('gemini_api_key');
      setHasKey(false);
      alert("유효하지 않은 API 키입니다. 다시 확인해주세요.");
    }
  };

  const handleConfirm = async () => {
    // Re-check key presence before generating
    let isKeyReady = hasKey;

    if (!isKeyReady) {
       // Try checking again (maybe env loaded late or user set it)
       const aiStudio = (window as any).aistudio as AIStudio | undefined;
       if (aiStudio) {
         isKeyReady = await aiStudio.hasSelectedApiKey();
       } else {
         isKeyReady = !!localStorage.getItem('gemini_api_key') || !!process.env.API_KEY;
       }
    }

    if (!isKeyReady) {
      await handleOpenKeyDialog();
      return;
    }

    setStep(AppStep.GENERATING);
    setError(null);
    
    try {
      const fullOptions: GenerationOptions = {
        sourceText,
        category: options.category,
        manualMusicStyle: options.manualMusicStyle,
        autoGenerateImages: options.autoGenerateImages,
        aspectRatio: options.aspectRatio,
        visualSettings: options.visualSettings,
        musicSettings: options.musicSettings,
        referenceImages: options.referenceImages,
        uploadedMedia: options.uploadedMedia
      };
      
      const data = await generateContent(fullOptions);
      saveToHistory(data, sourceText);
      
      setResults(data);
      setStep(AppStep.RESULTS);
      setActiveView('preview');
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("API Key is missing") || err.message.includes("Requested entity was not found"))) {
        setError("API 키 설정이 필요합니다.");
        setHasKey(false);
        setIsSettingsOpen(true);
      } else {
        setError(err.message || "오류가 발생했습니다.");
      }
      setStep(AppStep.CONFIRMATION);
    }
  };

  return (
    <div className="h-screen bg-[#FFF8F0] text-stone-700 font-sans break-keep flex flex-col overflow-hidden selection:bg-orange-200 selection:text-orange-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 shrink-0 z-20 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-400 p-2 rounded-2xl text-white shadow-lg shadow-orange-200"><Dog size={20} /></div>
          <div>
            <h1 className="text-lg font-display text-stone-800 leading-none tracking-tight">멍냥이 구조대</h1>
            <span className="text-[10px] text-orange-400 font-bold tracking-widest uppercase">AI STUDIO</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
             <button onClick={() => setActiveView('editor')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeView === 'editor' ? 'bg-white text-orange-500 shadow-sm' : 'text-stone-400'}`}>
                <Edit3 size={14} /> 작성
             </button>
             <button onClick={() => setActiveView('preview')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeView === 'preview' ? 'bg-white text-orange-500 shadow-sm' : 'text-stone-400'}`}>
                <MonitorPlay size={14} /> 미리보기
             </button>
           </div>
           
           <button onClick={() => setIsSettingsOpen(true)} className={`w-9 h-9 flex items-center justify-center bg-white border border-stone-200 rounded-xl transition-all shadow-sm ${hasKey ? 'text-orange-400' : 'text-stone-400'}`}>
             <Settings size={18} />
           </button>

           <button onClick={() => setIsHistoryOpen(true)} className="w-9 h-9 flex items-center justify-center bg-white border border-stone-200 rounded-xl text-stone-400 transition-all">
             <History size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-transform duration-500 p-4 lg:p-8 overflow-y-auto scrollbar-hide ${activeView === 'editor' ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="max-w-xl mx-auto pb-24">
            {step === AppStep.INPUT && <InputStep value={draftText} onChange={setDraftText} onNext={handleInputNext} />}
            {step === AppStep.CONFIRMATION && <ConfirmationStep onConfirm={handleConfirm} onEdit={() => setStep(AppStep.INPUT)} />}
            {step === AppStep.GENERATING && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
                <div className="relative mb-8">
                   <div className="w-24 h-24 border-4 border-orange-100 border-t-orange-400 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center"><PawPrint size={32} className="text-orange-400 animate-bounce" /></div>
                </div>
                <h3 className="text-2xl font-display text-stone-800 mb-2">마스터피스 제작 중... 🐾</h3>
                
                <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm max-w-xs mx-auto mt-4 space-y-3">
                   <div className="flex items-center gap-3 text-left">
                      <div className="bg-orange-50 p-2 rounded-lg text-orange-500"><Sparkles size={18}/></div>
                      <div>
                        <p className="text-xs font-bold text-stone-700">20장의 시네마틱 컷</p>
                        <p className="text-[10px] text-stone-400">8K 고화질로 렌더링 중입니다.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-left">
                      <div className="bg-pink-50 p-2 rounded-lg text-pink-500"><Clock size={18}/></div>
                      <div>
                        <p className="text-xs font-bold text-stone-700">약 1분 소요됩니다</p>
                        <p className="text-[10px] text-stone-400">잠시만 기다려주세요!</p>
                      </div>
                   </div>
                </div>
              </div>
            )}
            {step === AppStep.RESULTS && results && <ResultsStep data={results} onReset={() => setStep(AppStep.INPUT)} />}
            
            {error && (
              <div className="mt-6 p-5 bg-red-50 text-red-500 border border-red-100 rounded-3xl text-sm font-bold flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`absolute inset-0 transition-transform duration-500 p-4 lg:p-8 overflow-y-auto bg-stone-100 ${activeView === 'preview' ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="max-w-xl mx-auto h-full relative z-10 pb-24">
             <PreviewPanel step={step} text={step === AppStep.INPUT ? draftText : sourceText} results={results} />
          </div>
        </div>
      </main>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={loadHistoryItem} onDelete={deleteHistoryItem} />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-[2rem] shadow-2xl relative border-4 border-orange-100">
             <button onClick={() => setIsSettingsOpen(false)} className="absolute top-5 right-5 text-stone-400 bg-stone-100 rounded-full p-1"><X size={20}/></button>
             <h2 className="text-xl font-display text-stone-800 mb-6">설정</h2>
             
             <div className="space-y-4 animate-fadeIn">
               <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-sm text-stone-700 font-medium mb-2">Google Gemini API 설정</p>
                  
                  {isAIStudioEnv ? (
                    <>
                      <p className="text-xs text-stone-500 leading-relaxed mb-4">
                        비디오 및 고화질 이미지 생성을 위해 유료 프로젝트의 API 키 선택이 필요합니다. 
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-orange-500 ml-1 underline">결제 문서 확인</a>
                      </p>
                      <button 
                        onClick={handleOpenKeyDialog} 
                        className="w-full py-3 bg-orange-400 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <Key size={18} /> API 키 선택하기
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-stone-500 leading-relaxed mb-4">
                        Google AI Studio에서 발급받은 API 키를 입력해주세요.
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-500 ml-1 underline block mt-1">🔑 API 키 발급받기</a>
                      </p>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="password" 
                          value={customKey}
                          onChange={(e) => setCustomKey(e.target.value)}
                          placeholder="AIza..."
                          className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:border-orange-400 outline-none"
                        />
                        <button 
                          onClick={handleSaveCustomKey} 
                          className="w-full py-3 bg-orange-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors"
                        >
                          <Save size={18} /> 저장하고 시작하기
                        </button>
                      </div>
                    </>
                  )}

                  {hasKey && <p className="mt-3 text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> 키가 설정되어 있습니다.</p>}
               </div>
               <div className="pt-2">
                 <p className="text-[10px] text-stone-400 leading-relaxed uppercase tracking-tighter">
                   주의: API 키와 히스토리는 브라우저 로컬 저장소에 저장됩니다. 개인 기기에서만 사용하세요.
                 </p>
               </div>
             </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-orange-100 h-10 px-4 flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${step === AppStep.GENERATING ? 'bg-orange-400 animate-pulse' : 'bg-stone-300'}`}></div>
            <span>STEP: {step}</span>
         </div>
         <div className="flex items-center gap-1">
            <Heart size={10} className="text-pink-400 fill-pink-400" />
            <span>AI PET REUNION STUDIO</span>
         </div>
      </footer>
    </div>
  );
};

export default App;

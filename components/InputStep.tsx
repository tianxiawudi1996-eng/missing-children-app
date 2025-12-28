import React, { useState, useRef } from 'react';
import { ArrowRight, FileText, Youtube, Music, Camera, Sliders, Sparkles, Zap, Maximize, Smartphone, Monitor, Upload, X, Sun, Video, Map, Volume2, Mic2, Disc, Waves, Search, BrainCircuit, Loader2 } from 'lucide-react';
import { analyzeYoutubeContent } from '../services/geminiService';

interface InputStepProps {
  value: string;
  onChange: (text: string) => void;
  onNext: (options: any) => void;
  apiKey?: string;
}

const InputStep: React.FC<InputStepProps> = ({ value, onChange, onNext, apiKey }) => {
  const [mode, setMode] = useState<'text' | 'youtube'>('text');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [musicMode, setMusicMode] = useState<'auto' | 'manual'>('auto');
  const [manualMusicStyle, setManualMusicStyle] = useState('');
  
  // Music Studio Settings
  const [musicGenre, setMusicGenre] = useState('Ballad/OST');
  const [musicMood, setMusicMood] = useState('Touching & Sad');
  const [musicInstruments, setMusicInstruments] = useState('Piano, Strings');
  const [musicTempo, setMusicTempo] = useState('Slow');

  const [autoGenerateImages, setAutoGenerateImages] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "9:16">("16:9");
  
  // Visual Studio Settings
  const [lighting, setLighting] = useState('Cinematic/Moody');
  const [angle, setAngle] = useState('Eye Level');
  const [background, setBackground] = useState('Realistic Location');
  const [style, setStyle] = useState('Documentary Photo');
  
  // Reference Images
  const [refImages, setRefImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.slice(0, 3 - refImages.length).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setRefImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleYoutubeAnalysis = async () => {
    if (!youtubeInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeYoutubeContent(youtubeInput, apiKey);
      onChange(result);
      setMode('text');
      alert("영상 분석 완료! 실종 아동 정보가 추출되었습니다.");
    } catch (err: any) {
      console.error(err);
      alert(`분석 실패: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (value.trim()) {
      onNext({
        manualMusicStyle: musicMode === 'manual' ? manualMusicStyle : undefined,
        autoGenerateImages,
        aspectRatio,
        visualSettings: { lighting, angle, background, style },
        musicSettings: { 
          genre: musicGenre, 
          mood: musicMood, 
          instruments: musicInstruments, 
          tempo: musicTempo 
        },
        referenceImages: refImages
      });
    }
  };

  return (
    <div className="animate-fadeIn pb-10 space-y-8">
      <header>
        <h2 className="text-3xl font-black text-white mb-2">INPUT CASE DATA</h2>
        <p className="text-slate-400 text-sm font-medium">실종 아동의 정보를 입력하거나, 관련 유튜브 영상 링크/대본을 붙여넣으세요.</p>
      </header>

      {/* Mode Selector */}
      <div className="flex gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
        <button onClick={() => setMode('text')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${mode === 'text' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
          <FileText size={16} /> 텍스트 입력
        </button>
        <button onClick={() => setMode('youtube')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${mode === 'youtube' ? 'bg-red-600/20 text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
          <Youtube size={16} /> 유튜브 분석
        </button>
      </div>

      {/* Conditional View: YouTube Analysis (NotebookLM style) */}
      {mode === 'youtube' ? (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-6">
             <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase mb-4">
               <BrainCircuit size={18} /> Deep Context Analysis
             </div>
             <p className="text-xs text-slate-400 mb-4 leading-relaxed">
               뉴스 보도나 실종 전단지 관련 영상의 스크립트(자막)를 여기에 붙여넣으세요. 
               Gemini 3 Pro가 텍스트를 심층 분석하여 이름, 나이, 장소, 특징 등 핵심 팩트(Facts)를 자동으로 추출하고 정리합니다.
             </p>
             <textarea
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="유튜브 영상 스크립트 또는 기사 내용을 붙여넣으세요..."
                className="w-full h-64 p-5 bg-black/40 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-xs text-slate-300 font-mono leading-relaxed mb-4"
             />
             <button 
                onClick={handleYoutubeAnalysis}
                disabled={isAnalyzing || !youtubeInput.trim()}
                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/40"
             >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                {isAnalyzing ? "AI 분석 실행 중..." : "데이터 추출 및 분석 시작"}
             </button>
          </div>
        </div>
      ) : (
        <div className="relative group animate-fadeIn">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="여기에 실종 아동의 정보를 자유롭게 입력하세요. (이름, 실종 날짜, 장소, 인상착의, 가족의 메시지 등)"
            className="w-full h-72 p-6 bg-slate-900 border border-slate-800 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white font-mono leading-relaxed transition-all shadow-inner"
          />
        </div>
      )}

      {/* Music Studio Section */}
      <section className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all duration-500 ${musicMode === 'manual' ? 'border-purple-500 shadow-2xl shadow-purple-900/20' : 'border-slate-800'}`}>
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase">
            <Music size={18}/> Music Studio
          </div>
          <button onClick={() => setMusicMode(musicMode === 'auto' ? 'manual' : 'auto')} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${musicMode === 'manual' ? 'bg-purple-600' : 'bg-slate-700'}`}>
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-200 ${musicMode === 'manual' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        
        {musicMode === 'manual' && (
          <div className="p-6 space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
              <StudioSelect label="Genre" icon={<Disc size={12}/>} value={musicGenre} onChange={setMusicGenre} options={['Ballad/OST', 'Folk', 'Pop', 'Cinematic']} />
              <StudioSelect label="Mood" icon={<Waves size={12}/>} value={musicMood} onChange={setMusicMood} options={['Touching & Sad', 'Hopeful', 'Urgent', 'Calm']} />
              <StudioSelect label="Instruments" icon={<Mic2 size={12}/>} value={musicInstruments} onChange={setMusicInstruments} options={['Piano, Strings', 'Acoustic Guitar', 'Orchestra', 'Minimal']} />
              <StudioSelect label="Tempo" icon={<Volume2 size={12}/>} value={musicTempo} onChange={setMusicTempo} options={['Slow', 'Medium', 'Fast']} />
            </div>
            <textarea value={manualMusicStyle} onChange={(e) => setManualMusicStyle(e.target.value)} placeholder="추가적인 음악적 요청 사항을 입력하세요..." className="w-full h-24 p-4 bg-black/40 rounded-xl border border-purple-500/20 text-white text-xs outline-none focus:border-purple-500 transition-colors" />
          </div>
        )}
      </section>

      {/* Visual Studio Section */}
      <section className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all duration-500 ${autoGenerateImages ? 'border-blue-500 shadow-2xl shadow-blue-900/20' : 'border-slate-800'}`}>
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase"><Camera size={18}/> Visual Studio (Gemini Pro)</div>
          <button onClick={() => setAutoGenerateImages(!autoGenerateImages)} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${autoGenerateImages ? 'bg-blue-600' : 'bg-slate-700'}`}>
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-200 ${autoGenerateImages ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {autoGenerateImages && (
          <div className="p-6 space-y-8 animate-fadeIn">
            {/* Reference Images */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block flex items-center gap-2"><Upload size={14}/> REFERENCE IMAGES (MAX 3)</label>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {refImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 group shrink-0">
                    <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" />
                    <button onClick={() => setRefImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                  </div>
                ))}
                {refImages.length < 3 && (
                  <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all shrink-0">
                    <Upload size={20} />
                    <span className="text-[8px] font-bold mt-1">ADD</span>
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
              </div>
            </div>

            {/* Visual Control Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StudioSelect label="Lighting" icon={<Sun size={12}/>} value={lighting} onChange={setLighting} options={['Cinematic/Moody', 'Natural', 'Studio', 'Dark/Mystery']} />
              <StudioSelect label="Angle" icon={<Video size={12}/>} value={angle} onChange={setAngle} options={['Eye Level', 'Low Angle', 'High Angle', 'Close-up']} />
              <StudioSelect label="Background" icon={<Map size={12}/>} value={background} onChange={setBackground} options={['Realistic Location', 'Blurry', 'Solid Color', 'Abstract']} />
              <StudioSelect label="Art Style" icon={<Sparkles size={12}/>} value={style} onChange={setStyle} options={['Documentary Photo', '3D Pixar Style', 'Oil Painting', 'Sketch']} />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block">Screen Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {(["1:1", "4:3", "16:9", "9:16"] as const).map((ratio) => (
                  <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${aspectRatio === ratio ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <button onClick={handleNext} disabled={!value.trim()} className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-3xl hover:bg-blue-500 shadow-2xl shadow-blue-900/40 font-black text-lg transition-all transform active:scale-95 disabled:opacity-50">
        GENERATE CAMPAIGN <ArrowRight size={22} className="animate-pulse"/>
      </button>
    </div>
  );
};

const StudioSelect = ({ label, icon, value, onChange, options }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1">{icon}{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500 appearance-none">
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default InputStep;
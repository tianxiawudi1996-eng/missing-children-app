
import React, { useState } from 'react';
import { GenerationResult } from '../types';
import { 
  Music, Video, Image as ImageIcon, FileText, Check, Camera, 
  Aperture, Layers, Type, FileAudio, AlignLeft, Download, 
  Maximize2, Sparkles, Copy, ClipboardCheck, Heading 
} from 'lucide-react';

interface ResultsStepProps {
  data: GenerationResult;
  onReset: () => void;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'facts' | 'music' | 'youtube' | 'images'>('music');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 1500);
  };

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${
        activeTab === id ? 'border-blue-500 text-blue-400 bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden flex flex-col h-full animate-fadeIn relative">
      <div className="bg-black/40 p-5 flex justify-between items-start border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold">🎉 {data.factSummary.name} 지원 패키지</h2>
          <p className="text-xs text-slate-400 mt-1">총 {data.imagePrompts.length}개의 장면이 생성되었습니다.</p>
        </div>
        <button onClick={onReset} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold border border-slate-600 transition-all">🔄 새 프로젝트</button>
      </div>

      <div className="flex border-b border-slate-800 bg-slate-900">
        <TabButton id="facts" icon={FileText} label="팩트" />
        <TabButton id="music" icon={Music} label="음악" />
        <TabButton id="youtube" icon={Video} label="유튜브" />
        <TabButton id="images" icon={ImageIcon} label="이미지 (AI)" />
      </div>

      <div className="p-4 lg:p-5 overflow-y-auto bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4">
               <Sparkles className="text-blue-400 animate-pulse" size={24} />
               <div>
                  <h4 className="text-sm font-black text-blue-200 uppercase">AI Visual Sequence (10-20 Scenes)</h4>
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">Nano Banana 3.0 Pro가 생성한 스토리보드입니다. 영상 제작 시 배경으로 사용 가능합니다.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.imagePrompts.map((prompt, idx) => (
                <div key={idx} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col hover:border-blue-500/50 transition-all group shadow-lg">
                  <div className="relative overflow-hidden cursor-pointer" onClick={() => setSelectedImage(idx)}>
                    {prompt.generatedImage ? (
                      <img 
                        src={`data:image/png;base64,${prompt.generatedImage}`} 
                        className="w-full aspect-video sm:aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={prompt.section}
                      />
                    ) : (
                      <div className="aspect-video bg-slate-950 flex items-center justify-center text-slate-700 font-bold uppercase text-[10px]">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white border border-white/20">SCENE {idx + 1}</div>
                    {prompt.generatedImage && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Maximize2 size={24} className="text-white scale-90 group-hover:scale-100 transition-transform"/>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-tight">{prompt.section}</h3>
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">
                       {prompt.imagePromptEN}
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => copyToClipboard(prompt.imagePromptEN, `p-${idx}`)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all ${copiedSection === `p-${idx}` ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                          {copiedSection === `p-${idx}` ? <Check size={12}/> : <ImageIcon size={12}/>}
                          {copiedSection === `p-${idx}` ? 'DONE' : 'PROMPT'}
                       </button>
                       {prompt.generatedImage && (
                         <a href={`data:image/png;base64,${prompt.generatedImage}`} download={`scene_${idx+1}.png`} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/40">
                            <Download size={14} />
                         </a>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facts Tab */}
        {activeTab === 'facts' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-xs font-black text-blue-500 border-b border-slate-800 pb-3 mb-5 uppercase tracking-[0.2em]">Verified Fact Sheet</h3>
              <div className="space-y-4">
                <FactItem label="이름" value={data.factSummary.name} />
                <FactItem label="실종 일자" value={data.factSummary.missingDate} />
                <FactItem label="장소" value={data.factSummary.location} />
                <FactItem label="신체 특징" value={data.factSummary.physicalFeatures} />
                <FactItem label="당시 상황" value={data.factSummary.situation} />
                <div className="pt-4 border-t border-slate-800">
                  <span className="block text-[10px] font-black text-slate-500 uppercase mb-2">가족의 메시지</span>
                  <p className="text-sm text-blue-100/80 leading-relaxed italic break-keep bg-blue-900/10 p-4 rounded-xl border border-blue-500/10">"{data.factSummary.familyMessage}"</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Music Tab: Restored Individual Copy Buttons */}
        {activeTab === 'music' && (
           <div className="space-y-8 animate-fadeIn">
              <SongCard 
                trackId="t1" 
                trackLabel="MAIN K-POP MIX" 
                lang="KO/EN" 
                title={data.track1.titleKO} 
                subtitle={data.track1.titleEN} 
                prompt={data.track1.stylePrompt} 
                lyrics={data.track1.lyrics} 
                copiedSection={copiedSection} 
                onCopy={copyToClipboard} 
              />
              <SongCard 
                trackId="t2" 
                trackLabel="GLOBAL BALLAD" 
                lang="EN/KO" 
                title={data.track2.titleEN} 
                subtitle={data.track2.titleKO} 
                prompt={data.track2.stylePrompt} 
                lyrics={data.track2.lyrics} 
                copiedSection={copiedSection} 
                onCopy={copyToClipboard} 
              />
           </div>
        )}

        {/* Youtube Tab */}
        {activeTab === 'youtube' && (
          <div className="animate-fadeIn space-y-6">
             <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Youtube Package</h3>
                   <button onClick={() => copyToClipboard(JSON.stringify(data.youtubePackage, null, 2), 'yt-json')} className={`text-[10px] font-black px-3 py-1 rounded-lg border transition-all ${copiedSection === 'yt-json' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {copiedSection === 'yt-json' ? 'COPIED!' : 'JSON COPY'}
                   </button>
                </div>
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Video Title</span>
                        <button onClick={() => copyToClipboard(data.youtubePackage.title, 'yt-title')} className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          {copiedSection === 'yt-title' ? <Check size={10}/> : <Copy size={10}/>} 복사
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white border-b border-slate-800 pb-2">{data.youtubePackage.title}</p>
                   </div>
                   <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Description</span>
                        <button onClick={() => copyToClipboard(data.youtubePackage.descriptionKR, 'yt-desc')} className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          {copiedSection === 'yt-desc' ? <Check size={10}/> : <Copy size={10}/>} 본문 복사
                        </button>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">{data.youtubePackage.descriptionKR}</div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Overlay */}
      {selectedImage !== null && (
         <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedImage(null)}>
            <div className="max-w-4xl w-full flex flex-col gap-4" onClick={e => e.stopPropagation()}>
               <div className="relative">
                  <img src={`data:image/png;base64,${data.imagePrompts[selectedImage].generatedImage}`} className="w-full h-auto rounded-3xl border border-white/10 shadow-2xl" />
                  <button onClick={() => setSelectedImage(null)} className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-xl hover:scale-110 transition-transform font-bold">✕</button>
               </div>
               <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black text-white mb-2">{data.imagePrompts[selectedImage].section}</h3>
                  <p className="text-slate-400 text-sm italic">"{data.imagePrompts[selectedImage].imagePromptEN}"</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const FactItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 border-b border-slate-800/50 pb-2">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
    <p className="text-sm font-medium text-slate-200">{value || 'N/A'}</p>
  </div>
);

const SongCard = ({ trackId, trackLabel, lang, title, subtitle, prompt, lyrics, copiedSection, onCopy }: any) => (
  <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
    {/* Header with Title Copy */}
    <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 flex justify-between items-center">
       <div className="flex-1">
         <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{trackLabel} ({lang})</span>
         <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white">{title}</h3>
            <button 
              onClick={() => onCopy(title, `${trackId}-title`)} 
              className={`p-1.5 rounded-lg border transition-all ${copiedSection === `${trackId}-title` ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              title="제목 복사"
            >
              {copiedSection === `${trackId}-title` ? <Check size={14}/> : <Copy size={14}/>}
            </button>
         </div>
       </div>
       <div className="hidden sm:block">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500">
             <Music size={24} />
          </div>
       </div>
    </div>

    {/* Body with Style & Lyrics Copy */}
    <div className="p-6 bg-slate-950/40 space-y-6">
       {/* Style Prompt Section */}
       <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-500"/> Suno Style Prompt
            </span>
            <button 
              onClick={() => onCopy(prompt, `${trackId}-style`)} 
              className={`text-[9px] font-black px-2 py-1 rounded-md border transition-all ${copiedSection === `${trackId}-style` ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {copiedSection === `${trackId}-style` ? 'COPIED!' : 'STYLE COPY'}
            </button>
          </div>
          <p className="text-[11px] text-blue-200/80 font-mono bg-slate-900/80 p-3 rounded-xl border border-blue-500/10 italic leading-relaxed">
            {prompt}
          </p>
       </div>

       {/* Lyrics Section */}
       <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlignLeft size={12} className="text-purple-500"/> Lyrics (Numbers to Hangul)
            </span>
            <button 
              onClick={() => onCopy(lyrics, `${trackId}-lyrics`)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all ${copiedSection === `${trackId}-lyrics` ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'}`}
            >
              {copiedSection === `${trackId}-lyrics` ? <ClipboardCheck size={14}/> : <Copy size={14}/>}
              {copiedSection === `${trackId}-lyrics` ? 'LYRICS COPIED' : 'COPY FULL LYRICS'}
            </button>
          </div>
          <div className="relative group">
            <pre className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto p-5 bg-slate-900/50 rounded-2xl border border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
              {lyrics}
            </pre>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950/80 to-transparent rounded-b-2xl pointer-events-none"></div>
          </div>
       </div>
    </div>
  </div>
);

export default ResultsStep;

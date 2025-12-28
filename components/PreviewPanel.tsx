import React from 'react';
import { AppStep, GenerationResult } from '../types';
import { FileText, Music, Play } from 'lucide-react';

interface PreviewPanelProps {
  step: AppStep;
  text: string;
  results: GenerationResult | null;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ step, text, results }) => {
  // Case 1: Input or Confirmation Phase (Show Source Document)
  if (step === AppStep.INPUT || step === AppStep.CONFIRMATION || step === AppStep.GENERATING) {
    return (
      <div className="h-full flex flex-col animate-fadeIn">
        <div className="bg-slate-900 flex-1 rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
          {/* Document Header */}
          <div className="bg-slate-800 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <FileText size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Source Document</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
          </div>
          
          {/* Document Body */}
          <div className="flex-1 p-8 bg-slate-900 overflow-y-auto">
            {text ? (
              <div className="prose prose-sm prose-invert max-w-none text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {text}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
              </div>
            )}
          </div>

          {/* Document Footer */}
          <div className="bg-slate-800 border-t border-slate-700 px-5 py-2 flex justify-between items-center text-xs text-slate-500 font-mono">
            <span>{text.length} characters</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Results Phase (Show Output Preview)
  if (step === AppStep.RESULTS && results) {
    // Try to find a generated image for the thumbnail
    const thumbnailImage = results.imagePrompts.find(p => p.generatedImage)?.generatedImage;

    return (
      <div className="h-full flex flex-col gap-6 animate-fadeIn">
        
        {/* YouTube Preview Card */}
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden flex flex-col">
          {/* Mock Video Player */}
          <div className="aspect-video bg-black relative flex items-center justify-center group cursor-pointer overflow-hidden">
            {thumbnailImage ? (
               <img 
                 src={`data:image/png;base64,${thumbnailImage}`} 
                 alt="Thumbnail" 
                 className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
               />
            ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-40 group-hover:opacity-30 transition-opacity"></div>
            )}
            
            {/* Play Button Overlay */}
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl z-10 transform group-hover:scale-110 transition-transform">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
            </div>
            
            {/* Video Controls Mockup */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
               <div className="h-full w-1/3 bg-red-600"></div>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
              3:42
            </div>
          </div>
          
          {/* Metadata Section */}
          <div className="p-5 flex-1 overflow-y-auto">
            <h3 className="font-bold text-gray-100 text-lg leading-snug line-clamp-2 mb-2">
              {results.youtubePackage.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">AI</div>
              <span className="font-medium text-slate-300">Missing Children Support</span>
              <span className="text-slate-600">•</span>
              <span>조회수 0회</span>
              <span className="text-slate-600">•</span>
              <span>방금 전</span>
            </div>
            <div className="text-sm text-slate-300 mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <p className="whitespace-pre-wrap leading-relaxed">{results.youtubePackage.descriptionKR}</p>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                 <p className="text-slate-400 text-xs uppercase font-bold mb-1">Tags</p>
                 <div className="flex flex-wrap gap-1">
                  {results.youtubePackage.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Music Mini Card */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl shadow-lg border border-purple-800 p-4 text-white flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
               <Music size={20} />
             </div>
             <div>
               <div className="text-xs font-medium text-purple-200 uppercase">Selected Genre</div>
               <div className="font-bold text-purple-100">{results.musicDirection.genre}</div>
             </div>
           </div>
           <div className="text-right">
             <div className="text-xs font-medium text-indigo-200 uppercase">Vocal Style</div>
             <div className="font-bold text-indigo-100">{results.musicDirection.vocalStyle}</div>
           </div>
        </div>

      </div>
    );
  }

  return null;
};

export default PreviewPanel;

import React from 'react';
import { Edit2, AlertTriangle, ArrowRight, CheckSquare } from 'lucide-react';

interface ConfirmationStepProps {
  onConfirm: () => void;
  onEdit: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ onConfirm, onEdit }) => {
  return (
    <div className="animate-fadeIn h-full flex flex-col">
      <div className="mb-6">
         <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-2">
            ✅ 내용 검토
         </h2>
         <p className="text-slate-400 text-lg">
           우측 패널의 원본 데이터를 꼼꼼히 확인해 주세요.<br/>
           이 내용이 AI 생성의 유일한 근거가 됩니다.
         </p>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4 text-amber-400 font-bold text-lg">
          <AlertTriangle size={24} />
          <span>필수 체크리스트 (Checklist)</span>
        </div>
        <ul className="space-y-3">
          {[
            "📝 실종 아동의 이름 철자가 정확한가요?",
            "📅 실종 날짜와 장소 정보에 오류가 없나요?",
            "👁️ 신체 특징(점, 흉터 등)이 명확히 기술되었나요?",
            "🚫 확인되지 않은 추측이나 소문은 제외되었나요?"
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-amber-900/30 hover:border-amber-700/50 transition-colors">
              <div className="mt-0.5">
                  <CheckSquare size={18} className="text-amber-600" />
              </div>
              <span className="text-slate-300 font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={onConfirm}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-900/30 transition-all transform hover:scale-[1.01] font-bold text-xl border border-blue-500"
        >
          🚀 확인 완료 및 생성 시작
          <ArrowRight size={24} />
        </button>
        
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 text-slate-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-xl transition-colors font-semibold"
        >
          <Edit2 size={18} />
          ✏️ 다시 수정하기
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;

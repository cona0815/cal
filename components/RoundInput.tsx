import React from 'react';
import Keypad from './Keypad';
import { Calculator, Check, Trash2 } from 'lucide-react';

interface RoundInputProps {
  currentSum: number;
  isBalanced: boolean;
  filledCount: number;
  activePlayerName?: string;
  onAutoBalance: () => void;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClearAll: () => void;
  onSubmit: () => void;
}

const RoundInput: React.FC<RoundInputProps> = ({ 
  currentSum, 
  isBalanced, 
  filledCount,
  activePlayerName,
  onAutoBalance,
  onKeyPress,
  onDelete,
  onClearAll,
  onSubmit 
}) => {
  return (
    <div className="flex flex-col bg-red-950 border-t-2 border-red-900 shadow-2xl">
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-red-900/50">
        {/* Left: Clear Action */}
        <button 
            onClick={onClearAll}
            className="flex items-center gap-1 text-red-300 hover:text-red-100 text-xs px-2 py-1 rounded hover:bg-red-800/50 transition-colors"
            title="清空目前輸入 (不影響歷史紀錄)"
        >
           <Trash2 size={14} />
           <span>重輸本局</span>
        </button>

        {/* Right: Balance Status / Action */}
        <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-black/20 px-2 py-1 rounded-lg">
                <span className="text-yellow-500/70 text-xs">合計:</span>
                <span className={`text-lg font-bold font-mono leading-none ${currentSum === 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentSum > 0 ? `+${currentSum}` : currentSum}
                </span>
            </div>
            
            {!isBalanced ? (
                <button
                onClick={onAutoBalance}
                className="bg-yellow-500 hover:bg-yellow-400 text-red-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1 transition-colors"
                >
                <Calculator size={14} />
                平帳
                </button>
            ) : filledCount > 0 && (
                <div className="flex items-center gap-1 text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-800">
                    <Check size={14} />
                    <span className="text-xs font-bold">平衡</span>
                </div>
            )}
        </div>
      </div>

      {/* Keypad Area */}
      <div className="bg-red-950 p-1 pb-safe">
        <Keypad 
            onKeyPress={onKeyPress}
            onDelete={onDelete}
            onSubmit={onSubmit}
            canSubmit={isBalanced && filledCount > 0}
            submitLabel={isBalanced ? "結算本局\n(下一局)" : "尚未平帳"}
        />
      </div>
    </div>
  );
};

export default RoundInput;
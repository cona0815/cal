import React from 'react';
import { Delete, Check } from 'lucide-react';
import { KeypadProps } from '../types';

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete, onSubmit, canSubmit, submitLabel = "確認" }) => {
  // Replaced '-' with 'C' for Clear functionality
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0'];

  // Increased height from h-12/14 to h-16/20 for bigger buttons
  const btnBase = "active:scale-95 transition-transform flex items-center justify-center text-2xl font-bold rounded-xl shadow-sm select-none h-16 sm:h-20";
  const numBtn = `${btnBase} bg-white text-red-900 hover:bg-red-50`;
  const actionBtn = `${btnBase} bg-yellow-600 text-white hover:bg-yellow-500`;
  const clearBtn = `${btnBase} bg-red-200 text-red-800 hover:bg-red-300`;
  
  // Submit button: Added w-full to fill empty space.
  const submitBtn = `${canSubmit ? 'bg-green-600 text-white hover:bg-green-500 shadow-[0_4px_0_rgb(22,101,52)] active:shadow-none active:translate-y-[4px]' : 'bg-gray-600 text-gray-400 cursor-not-allowed'} transition-all flex flex-col items-center justify-center rounded-xl select-none h-full w-full p-1`;

  return (
    <div className="grid grid-cols-5 gap-3 p-3 bg-red-950 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="col-span-3 grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => onKeyPress(k)}
            className={k === 'C' ? clearBtn : numBtn}
          >
            {k === 'C' ? 'C' : k}
          </button>
        ))}
        {/* Backspace Button inside the number grid */}
        <button onClick={onDelete} className={actionBtn}>
          <Delete size={28} />
        </button>
      </div>

      <div className="col-span-2">
        <button 
          onClick={onSubmit} 
          disabled={!canSubmit} 
          className={submitBtn}
        >
          {/* Increased icon size to 56 */}
          <Check size={56} className="mb-1" strokeWidth={4} />
          {/* Increased text size to 2xl/3xl and tighter leading */}
          <span className="text-2xl sm:text-3xl font-bold whitespace-pre-line leading-none text-center">{submitLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default Keypad;
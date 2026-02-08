import React, { useState } from 'react';
import { Player } from '../types';
import { MAX_NAME_LENGTH } from '../constants';
import { Users, Play } from 'lucide-react';

interface SetupProps {
  players: Player[];
  onStart: (names: string[]) => void;
}

const Setup: React.FC<SetupProps> = ({ players, onStart }) => {
  const [names, setNames] = useState<string[]>(players.map(p => p.name));

  const handleNameChange = (index: number, value: string) => {
    if (value.length > MAX_NAME_LENGTH) return;
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-4 sm:space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="bg-yellow-500 p-3 sm:p-4 rounded-full inline-block shadow-lg mb-2 sm:mb-4">
           <Users className="w-8 h-8 sm:w-12 sm:h-12 text-red-900" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400 tracking-wider">開局設定</h1>
        <p className="text-red-200 text-sm sm:text-base">請輸入四位玩家的名稱</p>
      </div>

      <div className="w-full max-w-sm space-y-3 sm:space-y-4">
        {names.map((name, index) => (
          <div key={index} className="flex items-center space-x-3 bg-red-800/50 p-2 sm:p-3 rounded-lg border border-red-700">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-yellow-600 flex items-center justify-center text-red-950 font-bold text-sm sm:text-base">
              {index + 1}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              placeholder={`玩家 ${index + 1}`}
              className="flex-1 bg-transparent border-none text-white placeholder-red-400 focus:ring-0 text-base sm:text-lg font-medium text-center"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onStart(names)}
        className="w-full max-w-sm bg-gradient-to-r from-yellow-500 to-yellow-600 text-red-900 font-bold text-lg sm:text-xl py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center space-x-2 mt-4"
      >
        <Play className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
        <span>開始計分</span>
      </button>
    </div>
  );
};

export default Setup;
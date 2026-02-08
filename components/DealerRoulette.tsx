import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { X, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DealerRouletteProps {
  players: Player[];
  onComplete: (playerId: number) => void;
  onClose: () => void;
}

const DealerRoulette: React.FC<DealerRouletteProps> = ({ players, onComplete, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);

  const colors = ['#dc2626', '#ca8a04', '#7f1d1d', '#000000']; // Red, Gold, Dark Red, Black

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setWinner(null);

    // Calculate random rotation (min 5 spins + random segment)
    // Each segment is 90 degrees.
    // 0-90: Player 1 (Top Right), 90-180: Player 2 (Bottom Right)... 
    // Wait, CSS rotation moves clockwise. Pointer is at TOP (0deg).
    // If wheel rotates clockwise:
    // The segment passing the top pointer goes: 4 -> 3 -> 2 -> 1.
    // So we need to calculate carefully.
    
    const randomOffset = Math.floor(Math.random() * 360);
    const totalRotation = rotation + 1800 + randomOffset; // Add 5 full turns (1800)
    
    setRotation(totalRotation);

    // Duration of spin matches CSS transition (3s)
    setTimeout(() => {
        const normalizedDegree = totalRotation % 360;
        
        // Calculate which segment is at the top (0 degrees)
        // Since wheel moves clockwise, we subtract rotation from 360 (or just negate)
        // Segment 0 (Player 1): 270-360 (Top Right moves to Top Left... wait)
        
        // Let's simplify: 
        // Index 0 sits at 0-90deg.
        // Index 1 sits at 90-180deg.
        // Index 2 sits at 180-270deg.
        // Index 3 sits at 270-360deg.
        
        // When rotated X degrees clockwise, the index at the TOP (0deg fixed pointer) is:
        // (4 - floor(normalizedDegree / 90)) % 4 (roughly)
        // Let's verify: 
        // Rot 10deg -> Top is inside segment 3 (270-360) which was at left, now moving up? 
        // Actually, let's just use the logic:
        // pointer_angle = (360 - (normalizedDegree % 360)) % 360;
        // if pointer between 0-90 -> Player 1 (Index 0 is drawn at 0-90) -> No wait.
        
        // Visual Layout:
        // Slice 0 (P1): Top Right (0-90)
        // Slice 1 (P2): Bottom Right (90-180)
        // Slice 2 (P3): Bottom Left (180-270)
        // Slice 3 (P4): Top Left (270-360)
        
        // Pointer is at Top (0deg).
        // If we rotate 45deg clockwise: The slice at Top becomes Slice 3 (270-360).
        // Formula: Index = floor(((360 - normalizedDegree) % 360) / 90)
        
        const pointerAngle = (360 - (normalizedDegree % 360)) % 360;
        const winningIndex = Math.floor(pointerAngle / 90);
        
        const winningPlayer = players[winningIndex];
        setWinner(winningPlayer);
        setIsSpinning(false);
        
        // Confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#ef4444']
        });

        // Delay closing to show winner
        setTimeout(() => {
            onComplete(winningPlayer.id);
        }, 2500);

    }, 3000);
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="relative flex flex-col items-center w-full max-w-md">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8 px-4">
            <h2 className="text-2xl font-bold text-yellow-400">誰是莊家？</h2>
            {!isSpinning && (
                <button onClick={onClose} className="text-white/50 hover:text-white">
                    <X size={24} />
                </button>
            )}
        </div>

        {/* Wheel Container */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-10">
            {/* Pointer (Triangle) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-lg"></div>

            {/* The Wheel */}
            <div 
                className="w-full h-full rounded-full border-4 border-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)] relative overflow-hidden transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{ 
                    transform: `rotate(${rotation}deg)`,
                    background: `conic-gradient(
                        ${colors[0]} 0deg 90deg, 
                        ${colors[1]} 90deg 180deg, 
                        ${colors[2]} 180deg 270deg, 
                        ${colors[3]} 270deg 360deg
                    )` 
                }}
            >
                {/* Lines separating segments */}
                <div className="absolute inset-0 w-full h-full">
                    <div className="absolute top-0 left-1/2 h-full w-1 bg-yellow-900/30 -translate-x-1/2"></div>
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-900/30 -translate-y-1/2"></div>
                </div>

                {/* Player Names */}
                {players.map((p, i) => {
                    // Position labels in the center of their 90deg slice
                    // 0: 45deg, 1: 135deg, 2: 225deg, 3: 315deg
                    const angle = 45 + (i * 90);
                    return (
                        <div 
                            key={p.id}
                            className="absolute top-1/2 left-1/2 w-full text-center origin-left flex items-center justify-end pr-6 font-bold text-white text-lg shadow-black drop-shadow-md"
                            style={{ 
                                transform: `rotate(${angle - 90}deg) translate(0, -50%)`, // -90 adjustment because default is 3 o'clock
                                height: '40px',
                                width: '50%', // Half width to rotate from center
                                textShadow: '1px 1px 2px black'
                            }}
                        >
                            <span className="transform rotate-90 inline-block">{p.name}</span>
                        </div>
                    );
                })}
            </div>

            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg border-2 border-yellow-200 flex items-center justify-center text-red-900 font-bold text-xs">
                莊
            </div>
        </div>

        {/* Controls / Result */}
        <div className="h-20 flex items-center justify-center w-full">
            {winner ? (
                <div className="bg-yellow-500 text-red-900 px-8 py-3 rounded-xl font-bold text-2xl animate-bounce shadow-lg flex items-center gap-2">
                    <Trophy size={24} />
                    {winner.name}
                </div>
            ) : (
                <button 
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className={`
                        px-10 py-4 rounded-xl font-bold text-xl shadow-lg transition-all
                        ${isSpinning 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed scale-95' 
                            : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-105 hover:shadow-red-500/50'
                        }
                    `}
                >
                    {isSpinning ? '轉動中...' : '開始轉盤'}
                </button>
            )}
        </div>

        <p className="mt-6 text-white/40 text-sm">
            隨機選出一位莊家，祝好運！
        </p>
      </div>
    </div>
  );
};

export default DealerRoulette;
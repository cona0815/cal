import React, { useState, useEffect, useRef } from 'react';
import { Player, Round, InputMode } from './types';
import { INITIAL_PLAYERS, MAX_NAME_LENGTH, HORSE_YEAR_BLESSINGS } from './constants';
import Setup from './components/Setup';
import RoundInput from './components/RoundInput';
import DealerRoulette from './components/DealerRoulette';
import { History, RotateCcw, Trash2, Trophy, Coins, Settings, Download, Eraser, Crown, CircleHelp, X, FileText, FileDown, Dices } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>('SETUP');
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  
  // Ref for PDF generation
  const printRef = useRef<HTMLDivElement>(null);
  
  // --- Dealer State ---
  const [dealerId, setDealerId] = useState<number>(1);

  // --- Name Edit State ---
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempNames, setTempNames] = useState<string[]>([]);

  // --- Input State ---
  const [inputValues, setInputValues] = useState<{ [id: number]: string }>({});
  const [activePlayerId, setActivePlayerId] = useState<number>(0);

  // Load from local storage
  useEffect(() => {
    const savedData = localStorage.getItem('mahjong_score_app_v1');
    if (savedData) {
      try {
        const { players, rounds, mode, dealerId: savedDealerId } = JSON.parse(savedData);
        setPlayers(players);
        setRounds(rounds);
        if (savedDealerId) setDealerId(savedDealerId);
        if (mode === 'GAME' || mode === 'ROUND_INPUT') {
            setMode('GAME'); 
        } else {
            setMode(mode);
        }
      } catch (e) {
        console.error("Failed to load saved game", e);
      }
    }
  }, []);

  // Initialize inputs
  useEffect(() => {
    if (players.length > 0) {
        if (Object.keys(inputValues).length === 0) {
            setInputValues(players.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}));
            if (activePlayerId === 0) setActivePlayerId(players[0].id);
        }
    }
  }, [players, mode]);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('mahjong_score_app_v1', JSON.stringify({ players, rounds, mode, dealerId }));
  }, [players, rounds, mode, dealerId]);

  // --- Logic Helpers ---

  // Calculate current blessing title
  const blessingIndex = Math.floor(rounds.length / 5) % HORSE_YEAR_BLESSINGS.length;
  const currentTitle = HORSE_YEAR_BLESSINGS[blessingIndex];

  const currentSum: number = (Object.values(inputValues) as string[]).reduce((sum: number, val: string) => {
    const num = parseInt(val, 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const isBalanced = currentSum === 0;
  const filledCount = Object.values(inputValues).filter(v => v !== '' && v !== '-').length;

  const handleStartGame = (names: string[]) => {
    const newPlayers = players.map((p, i) => ({ ...p, name: names[i] || p.name }));
    setPlayers(newPlayers);
    setMode('GAME');
    setActivePlayerId(newPlayers[0].id);
    setInputValues(newPlayers.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}));
  };

  const handleKeyPress = (key: string) => {
    if (activePlayerId === 0) return;

    // Handle Clear Key
    if (key === 'C') {
        setInputValues(prev => ({ ...prev, [activePlayerId]: '' }));
        return;
    }

    setInputValues(prev => {
      const currentVal = prev[activePlayerId] || '';
      
      // Handle Sign Toggle
      if (key === '-') {
        if (currentVal === '') return { ...prev, [activePlayerId]: '-' };
        if (currentVal === '-') return { ...prev, [activePlayerId]: '' };
        if (currentVal.startsWith('-')) return { ...prev, [activePlayerId]: currentVal.substring(1) };
        return { ...prev, [activePlayerId]: '-' + currentVal };
      }

      // Handle New Number Entry
      if (currentVal === '') {
         return { ...prev, [activePlayerId]: `-${key}` };
      }
      if (currentVal === '-') {
         return { ...prev, [activePlayerId]: `-${key}` };
      }

      // Validations
      if (currentVal === '0' && key !== '0') return { ...prev, [activePlayerId]: key };
      if (currentVal === '-0' && key !== '0') return { ...prev, [activePlayerId]: '-' + key };
      if ((currentVal === '0' || currentVal === '-0') && key === '0') return prev;
      if (currentVal.length > 5) return prev;

      return { ...prev, [activePlayerId]: currentVal + key };
    });
  };

  const handleDelete = () => {
    if (activePlayerId === 0) return;
    setInputValues(prev => {
      const currentVal = prev[activePlayerId] || '';
      return { ...prev, [activePlayerId]: currentVal.slice(0, -1) };
    });
  };

  const handleClearAllInputs = () => {
    if (Object.values(inputValues).some(v => v !== '' && v !== '-')) {
        if (!window.confirm("確定要清空目前輸入的數字嗎？(不會刪除歷史局數)")) return;
    }
    setInputValues(players.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}));
  };

  const handleAutoBalance = () => {
    if (activePlayerId === 0) return;
    let sumOthers = 0;
    players.forEach(p => {
      if (p.id !== activePlayerId) {
        const val = parseInt(inputValues[p.id], 10);
        if (!isNaN(val)) sumOthers += val;
      }
    });
    const needed = -sumOthers;
    setInputValues(prev => ({ ...prev, [activePlayerId]: needed.toString() }));
  };

  const triggerConfetti = () => {
    const duration = 1500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#eab308', '#ffffff'] // Red, Gold, White
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#eab308', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleSubmitRound = () => {
    if (!isBalanced) return;
    
    // Trigger celebration
    triggerConfetti();

    const finalScores: { [id: number]: number } = {};
    players.forEach(p => {
      const val = parseInt(inputValues[p.id], 10);
      finalScores[p.id] = isNaN(val) ? 0 : val;
    });

    const newRound: Round = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      scores: finalScores
    };

    const updatedPlayers = players.map(p => ({
      ...p,
      totalScore: p.totalScore + (finalScores[p.id] || 0)
    }));

    setRounds([newRound, ...rounds]);
    setPlayers(updatedPlayers);
    
    // Reset inputs for the NEXT ROUND
    setInputValues(updatedPlayers.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}));
    setActivePlayerId(updatedPlayers[0].id);
  };

  const handlePlayerClick = (id: number) => {
    if (id === activePlayerId) {
       // Toggle sign logic
       setInputValues(prev => {
        const val = prev[id] || '';
        if (val === '') return { ...prev, [id]: '-' };
        if (val === '-') return { ...prev, [id]: '' };
        if (val.startsWith('-')) return { ...prev, [id]: val.substring(1) };
        return { ...prev, [id]: '-' + val };
      });
    } else {
       // --- Switch Player & Auto-Balance Logic ---
       let filledCount = 0;
       let sumOthers = 0;
       
       players.forEach(p => {
          if (p.id !== id) {
             const rawVal = inputValues[p.id];
             if (rawVal && rawVal !== '-' && rawVal !== '') {
                 const val = parseInt(rawVal, 10);
                 if (!isNaN(val)) {
                     filledCount++;
                     sumOthers += val;
                 }
             }
          }
       });

       if (filledCount === 3) {
           const needed = -sumOthers;
           setInputValues(prev => ({ ...prev, [id]: needed.toString() }));
       }

       setActivePlayerId(id);
    }
  };

  const handleSetDealer = (e: React.MouseEvent, id: number) => {
      e.stopPropagation(); // Prevent activating player when clicking dealer button
      setDealerId(id);
  };

  const handleRouletteComplete = (playerId: number) => {
      setDealerId(playerId);
      setShowRoulette(false);
  };

  const handleReset = () => {
    if (window.confirm("【警告】\n確定要「完全重置」遊戲嗎？\n\n這將會：\n1. 清除所有分數與歷史記錄\n2. 回到設定畫面\n\n(若只是這局打錯，請按下方垃圾桶圖示) ")) {
      // Clear storage
      localStorage.removeItem('mahjong_score_app_v1');
      // Force reload to ensure a completely fresh state (solving the "ineffective" issue)
      window.location.reload();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("確定要清空所有記錄並重置分數嗎？\n(玩家名稱將會保留)")) {
      const resetPlayers = players.map(p => ({ ...p, totalScore: 0 }));
      setPlayers(resetPlayers);
      setRounds([]);
      setInputValues(resetPlayers.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}));
    }
  };

  const deleteRound = (roundId: string) => {
    if(!window.confirm("確定刪除此局記錄？")) return;
    const roundToDelete = rounds.find(r => r.id === roundId);
    if (!roundToDelete) return;

    const updatedPlayers = players.map(p => ({
      ...p,
      totalScore: p.totalScore - (roundToDelete.scores[p.id] || 0)
    }));
    setPlayers(updatedPlayers);
    setRounds(rounds.filter(r => r.id !== roundId));
  };
  
  // --- Name Editing Handlers ---
  const handleOpenNameEdit = () => {
    setTempNames(players.map(p => p.name));
    setIsEditingNames(true);
  };

  const handleSaveNames = () => {
    const newPlayers = players.map((p, i) => ({ 
        ...p, 
        name: (tempNames[i] && tempNames[i].trim()) || p.name 
    }));
    setPlayers(newPlayers);
    setIsEditingNames(false);
  };

  // --- Export PDF with Image Snapshot to fix Font Encoding ---
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    // Temporarily show alert if generating takes a second
    // Or just let async do its thing.
    
    try {
        const canvas = await html2canvas(printRef.current, {
            scale: 2, // Better resolution
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position - heightLeft - pdfHeight, pdfWidth, imgHeight); // Simple logic
            heightLeft -= pdfHeight;
        }

        const now = new Date();
        const fileName = `Score_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("PDF Export failed", error);
        alert("匯出失敗，請稍後再試");
    }
  };

  if (mode === 'SETUP') {
    return <Setup players={players} onStart={handleStartGame} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[radial-gradient(ellipse_at_top,_#b91c1c_0%,_#450a0a_100%)] text-yellow-100 overflow-hidden relative">
      
      {/* Background Texture - Subtle Dots */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
      </div>

      {/* --- HIDDEN PRINT VIEW (For HTML2Canvas) --- */}
      <div 
        ref={printRef} 
        className="fixed left-[-9999px] top-0 w-[210mm] min-h-[297mm] bg-white text-black p-10 font-sans"
      >
        <div className="text-center border-b-2 border-red-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-red-900 mb-2">招財計分 - 結算單</h1>
            <p className="text-gray-500">匯出時間: {new Date().toLocaleString()}</p>
        </div>

        <div className="mb-8">
            <h2 className="text-xl font-bold text-red-800 border-l-4 border-red-800 pl-3 mb-4">總分合計</h2>
            <div className="grid grid-cols-4 gap-4">
                {players.map(p => (
                    <div key={p.id} className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                        <div className="font-bold text-gray-700 mb-1">{p.name}</div>
                        <div className={`text-2xl font-mono font-bold ${p.totalScore >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {p.totalScore > 0 ? `+${p.totalScore}` : p.totalScore}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-bold text-red-800 border-l-4 border-red-800 pl-3 mb-4">詳細戰績</h2>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-red-800 text-white">
                        <th className="p-3 text-left">局數</th>
                        <th className="p-3 text-left">時間</th>
                        {players.map(p => <th key={p.id} className="p-3 text-right">{p.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rounds.map((r, i) => (
                        <tr key={r.id} className="border-b border-gray-200 even:bg-gray-50">
                            <td className="p-3 font-bold text-gray-600">Round {rounds.length - i}</td>
                            <td className="p-3 text-gray-500">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            {players.map(p => {
                                const score = r.scores[p.id] || 0;
                                return (
                                    <td key={p.id} className={`p-3 text-right font-mono font-bold ${score > 0 ? 'text-red-600' : score < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {score > 0 ? `+${score}` : score}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-8 text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
            Created with Lucky Scorekeeper
        </div>
      </div>

      {/* --- TOP SECTION: Header + Cards (Full height) --- */}
      <div className="flex-1 flex flex-col min-h-0 z-10 relative">
        
        {/* Header Bar */}
        <div className="flex-none flex items-center justify-between px-4 py-3 bg-black/10 backdrop-blur-sm border-b border-white/5">
            <h1 className="text-xl font-bold text-yellow-400 tracking-wider drop-shadow-sm animate-fade-in key-{currentTitle}">
                {currentTitle}
            </h1>
            <div className="flex items-center gap-1 bg-black/30 rounded-full p-1 border border-white/10">
                <button 
                    onClick={() => setShowHelp(true)} 
                    className="p-2 text-yellow-400/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="使用說明書"
                >
                    <CircleHelp size={20} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1"></div>
                <button 
                    onClick={handleOpenNameEdit} 
                    className="p-2 text-yellow-400/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="修改玩家名稱"
                >
                    <Settings size={20} />
                </button>

                <button 
                    onClick={() => setShowRoulette(true)} 
                    className="p-2 text-yellow-400/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="轉盤決定莊家"
                >
                    <Dices size={20} />
                </button>
                
                {/* PDF & History Group */}
                <div className="flex gap-1 ml-1 mr-2">
                    <button 
                        onClick={handleExportPDF} 
                        className="p-2 text-green-400/90 hover:text-white hover:bg-green-500/20 rounded-full transition-all"
                        title="匯出 PDF"
                    >
                        <FileDown size={20} />
                    </button>

                    <button 
                        onClick={() => setShowHistory(!showHistory)} 
                        className={`p-2 rounded-full transition-all ${showHistory ? 'bg-yellow-500 text-red-900 shadow-lg scale-105' : 'text-yellow-400/80 hover:text-white hover:bg-white/10'}`}
                        title="歷史記錄"
                    >
                        <History size={20} />
                    </button>
                </div>
                
                {/* Reset Button - Separated and highlighted */}
                <div className="w-px h-4 bg-white/20 mx-1"></div>
                <button 
                    onClick={handleReset} 
                    className="p-2 text-red-400/80 hover:text-red-100 hover:bg-red-500/50 rounded-full transition-all"
                    title="重置整個遊戲"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>

        {/* Player Cards Area - Now fills the rest of the top space */}
        <div className="flex-1 flex flex-row-reverse gap-2 p-3 pb-2 items-stretch z-10 relative overflow-hidden">
          
          {/* Watermark moved to background of this container */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <div className="relative animate-pulse-slow">
                    <Coins size={180} className="text-yellow-500" strokeWidth={0.5} />
                    <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20"></div>
                </div>
           </div>

          {players.map((player) => {
            const isWinner = player.totalScore > 0;
            const isTopWinner = player.totalScore === Math.max(...players.map(p => p.totalScore)) && player.totalScore !== 0;
            const isActive = activePlayerId === player.id;
            const isDealer = dealerId === player.id;
            const currentInput = inputValues[player.id];
            const hasInput = currentInput && currentInput !== '';
            
            return (
                <div 
                  key={player.id} 
                  onClick={() => handlePlayerClick(player.id)}
                  className={`
                    relative flex-1 flex flex-col items-center justify-center rounded-xl shadow-lg transition-all cursor-pointer select-none overflow-hidden py-4
                    backdrop-blur-md
                    ${isActive 
                        ? 'bg-gradient-to-b from-yellow-900/60 to-black/40 ring-2 ring-yellow-400/70 shadow-[0_0_15px_rgba(250,204,21,0.3)] transform -translate-y-1' 
                        : isWinner 
                            ? 'bg-gradient-to-b from-red-800/40 to-black/20 border border-yellow-500/20' 
                            : 'bg-black/20 border border-white/5'
                    }
                  `}
                >
                  {/* Dealer Button (Top Left) */}
                  <button 
                    onClick={(e) => handleSetDealer(e, player.id)}
                    className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                        isDealer 
                        ? 'bg-yellow-500 border-yellow-300 text-red-900 shadow-[0_0_10px_rgba(234,179,8,0.5)] scale-110' 
                        : 'bg-black/30 border-white/10 text-white/30 hover:bg-black/50 hover:text-white/70'
                    }`}
                  >
                    {isDealer ? <span className="font-serif text-lg">莊</span> : <span className="text-xs">莊</span>}
                  </button>

                  {/* Rank Badge (Top Right) */}
                  {isTopWinner && (
                      <div className="absolute top-2 right-2 text-yellow-400 z-10 filter drop-shadow-md">
                          <Trophy size={18} fill="currentColor" />
                      </div>
                  )}

                  {/* Top: Name - Enlarged by 3x (approx) */}
                  <div className="w-full text-center mb-1 flex-1 flex items-center justify-center min-h-0">
                    <h3 className={`text-6xl font-black leading-none break-all vertical-rl ${isActive ? 'text-yellow-300' : 'text-white/70'}`} style={{ wordBreak: 'break-all' }}>
                        {player.name}
                    </h3>
                  </div>

                  {/* Center: Content */}
                  <div className="flex-none flex flex-col items-center justify-center w-full gap-2 py-4">
                    
                    {/* Total Score */}
                    <div className={`transition-all duration-300 flex flex-col items-center justify-center ${hasInput ? 'scale-75 opacity-60' : 'scale-100'}`}>
                        <div className={`text-3xl lg:text-4xl font-mono font-bold leading-none ${player.totalScore > 0 ? 'text-red-300' : 'text-gray-300'}`}>
                            {player.totalScore > 0 && '+'}{player.totalScore}
                        </div>
                    </div>

                    {/* Current Input */}
                    {hasInput && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 rounded-xl">
                             <div className={`text-3xl lg:text-4xl font-mono font-bold drop-shadow-md ${
                                 currentInput.startsWith('-') ? 'text-green-400' : 'text-red-400'
                             }`}>
                                {currentInput}
                             </div>
                        </div>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* --- BOTTOM SECTION: Control Panel (Keypad) --- */}
      <div className="flex-none z-20">
          <RoundInput 
            currentSum={currentSum}
            isBalanced={isBalanced}
            filledCount={filledCount}
            activePlayerName={players.find(p => p.id === activePlayerId)?.name}
            onAutoBalance={handleAutoBalance}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onClearAll={handleClearAllInputs}
            onSubmit={handleSubmitRound}
          />
      </div>

      {/* --- MODALS --- */}

      {/* Roulette Modal */}
      {showRoulette && (
          <DealerRoulette 
              players={players} 
              onComplete={handleRouletteComplete} 
              onClose={() => setShowRoulette(false)} 
          />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[70] overflow-y-auto animate-fade-in p-4 flex items-center justify-center">
            <div className="bg-red-950/90 border border-yellow-500/30 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                    <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <CircleHelp size={24} /> 使用說明書
                    </h2>
                    <button onClick={() => setShowHelp(false)} className="text-white/50 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 text-yellow-100/90">
                    
                    <section>
                        <h3 className="text-lg font-bold text-yellow-500 mb-2 flex items-center gap-2">
                            <Coins size={18} /> 1. 如何記分？
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                            <li>點選<strong>玩家卡片</strong>（變亮）來輸入該玩家的分數。</li>
                            <li>若玩家<strong>贏錢</strong>，直接輸入數字。</li>
                            <li>若玩家<strong>輸錢</strong>，再點一次頭像或按「-」號，數字會變綠色負數。</li>
                            <li><strong>自動算分：</strong> 輸入完三家分數後，直接點擊第四家，系統會自動填入剩餘分數（平帳）。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-yellow-500 mb-2 flex items-center gap-2">
                            <Crown size={18} /> 2. 設定莊家
                        </h3>
                        <p className="text-sm text-gray-300">
                            點擊玩家卡片左上角的 <span className="inline-block px-1.5 py-0.5 bg-yellow-500 text-red-900 text-xs rounded-full font-bold">莊</span> 按鈕，即可標記該玩家為本局莊家。
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                            也可以點擊上方工具列的 <Dices size={16} className="inline"/> <strong>骰子圖示</strong> 開啟輪盤來隨機決定莊家！
                        </p>
                    </section>
                    
                    <section>
                        <h3 className="text-lg font-bold text-yellow-500 mb-2 flex items-center gap-2">
                            <RotateCcw size={18} /> 3. 如何開啟新局？
                        </h3>
                        <p className="text-sm text-gray-300">
                           當四家分數輸入完畢且<strong>合計為 0</strong> 時，下方的綠色大按鈕會亮起。
                           點擊 <strong>「結算本局 (下一局)」</strong>，系統會自動儲存並清空輸入框，直接開始下一局。
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-yellow-500 mb-2 flex items-center gap-2">
                            <FileDown size={18} /> 4. 匯出與歷史
                        </h3>
                        <p className="text-sm text-gray-300 mb-2">
                            點擊右上角的 <FileDown size={16} className="inline mx-1" /> <strong>文件圖示</strong>，可下載戰績 PDF。<br/>
                            點擊 <History size={16} className="inline mx-1" /> <strong>時鐘圖示</strong>，可查看每一局詳細分數。
                        </p>
                    </section>

                    <div className="pt-4 text-center">
                        <button 
                            onClick={() => setShowHelp(false)} 
                            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                        >
                            我瞭解了，開始打牌！
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Name Edit Modal */}
      {isEditingNames && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-red-950/90 border border-yellow-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
                <h2 className="text-xl font-bold text-yellow-400 text-center flex items-center justify-center gap-2">
                    <Settings size={20} /> 修改玩家名稱
                </h2>
                <div className="space-y-3">
                    {tempNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-yellow-600/20 text-yellow-500 flex items-center justify-center text-xs font-bold border border-yellow-600/30">
                                {idx + 1}
                            </div>
                            <input 
                                type="text"
                                value={name} 
                                onChange={e => {
                                    if(e.target.value.length > MAX_NAME_LENGTH) return;
                                    const newNames = [...tempNames];
                                    newNames[idx] = e.target.value;
                                    setTempNames(newNames);
                                }}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-yellow-100 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none text-center"
                                placeholder={`玩家 ${idx + 1}`}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setIsEditingNames(false)} 
                        className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-400 font-bold hover:bg-gray-700 transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSaveNames} 
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-red-950 font-bold shadow-lg hover:shadow-yellow-500/20 transition-all"
                    >
                        儲存
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* History Overlay */}
      {showHistory && (
            <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md z-50 overflow-y-auto p-4 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History size={20} /> 歷史記錄 ({rounds.length})
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleClearHistory} 
                            className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors border border-red-500"
                        >
                            <Eraser size={16} /> 清空資料
                        </button>
                        <button onClick={() => setShowHistory(false)} className="text-yellow-400 font-bold px-4 py-2 border border-yellow-600 rounded-lg hover:bg-yellow-600/20">
                            關閉
                        </button>
                    </div>
                </div>

                {/* --- Total Summary Section Added Here --- */}
                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-yellow-500/30">
                    <h3 className="text-yellow-400 text-sm font-bold mb-3 uppercase tracking-wider text-center border-b border-white/5 pb-2">目前總計</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {players.map(p => (
                            <div key={p.id} className="flex flex-col items-center">
                                <span className="text-gray-400 text-xs mb-1">{p.name}</span>
                                <span className={`font-mono text-xl font-bold ${p.totalScore > 0 ? 'text-red-400' : p.totalScore < 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                    {p.totalScore > 0 ? `+${p.totalScore}` : p.totalScore}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {rounds.length === 0 ? (
                    <div className="text-center text-white/50 py-10">尚無記錄</div>
                ) : (
                    <div className="space-y-3 pb-20">
                        {rounds.map((round, idx) => (
                            <div key={round.id} className="bg-white text-red-900 rounded-xl p-3 shadow-md">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                    <span className="text-xs font-bold text-gray-400">Round {rounds.length - idx}</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button onClick={() => deleteRound(round.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                    {[...players].reverse().map(p => (
                                        <div key={p.id} className="flex flex-col">
                                            <span className="text-gray-400 text-xs scale-90">{p.name}</span>
                                            <span className={`font-mono font-bold ${round.scores[p.id] > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                                {round.scores[p.id] > 0 ? `+${round.scores[p.id]}` : round.scores[p.id]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
      )}
    </div>
  );
};

export default App;
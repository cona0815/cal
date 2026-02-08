export interface Player {
  id: number;
  name: string;
  totalScore: number;
}

export interface Round {
  id: string;
  timestamp: number;
  scores: {
    [playerId: number]: number;
  };
}

export type InputMode = 'SETUP' | 'GAME' | 'ROUND_INPUT';

export interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitLabel?: string;
}

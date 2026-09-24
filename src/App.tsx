import { useState } from 'react';
import { DEFAULT_RULES, type Rules, type Side } from './game/engine';
import type { Level } from './game/ai';
import { PUZZLES, type Difficulty } from './game/puzzles';
import { RulesModal } from './components/RulesModal';
import { SvgDefs } from './components/ui';
import { MenuScreen } from './screens/MenuScreen';
import { PlayScreen, type PlayConfig } from './screens/PlayScreen';
import { loadSolved, PuzzleScreen } from './screens/PuzzleScreen';

type Screen = 'menu' | 'play' | 'puzzles';

function loadLevel(): Level {
  try {
    const v = localStorage.getItem('filipino-dama-level');
    if (v === 'easy' || v === 'medium' || v === 'hard') return v;
  } catch {
    /* ignore */
  }
  return 'medium';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevelState] = useState<Level>(loadLevel);
  const [humanSide, setHumanSide] = useState<Side>(1);
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [playConfig, setPlayConfig] = useState<PlayConfig | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [solved, setSolved] = useState<string[]>(loadSolved);
  const [puzzleStart, setPuzzleStart] = useState(0);

  const setLevel = (l: Level) => {
    setLevelState(l);
    try {
      localStorage.setItem('filipino-dama-level', l);
    } catch {
      /* ignore */
    }
  };

  const startPlay = (mode: 'ai' | 'pvp') => {
    setPlayConfig({ mode, level, humanSide: mode === 'ai' ? humanSide : 1, rules });
    setGameKey((k) => k + 1);
    setScreen('play');
    window.scrollTo({ top: 0 });
  };

  /** Open the puzzles at the first unsolved level (optionally within one difficulty). */
  const openPuzzles = (difficulty?: Difficulty) => {
    const done = loadSolved();
    const pool = PUZZLES.map((p, i) => ({ p, i })).filter(({ p }) => !difficulty || p.difficulty === difficulty);
    const first = pool.find(({ p }) => !done.includes(p.id)) ?? pool[0];
    setPuzzleStart(first ? first.i : 0);
    setGameKey((k) => k + 1);
    setScreen('puzzles');
    window.scrollTo({ top: 0 });
  };

  const toMenu = () => {
    setSolved(loadSolved());
    setScreen('menu');
    window.scrollTo({ top: 0 });
  };

  const activeRules = screen === 'puzzles' ? DEFAULT_RULES : screen === 'play' && playConfig ? playConfig.rules : rules;

  return (
    <div className="app-bg min-h-screen">
      <SvgDefs />
      {screen === 'menu' && (
        <MenuScreen
          level={level}
          setLevel={setLevel}
          humanSide={humanSide}
          setHumanSide={setHumanSide}
          rules={rules}
          setRules={setRules}
          solved={solved}
          onPlayAI={() => startPlay('ai')}
          onPlayPvP={() => startPlay('pvp')}
          onPuzzles={openPuzzles}
          onRules={() => setRulesOpen(true)}
        />
      )}
      {screen === 'play' && playConfig && (
        <PlayScreen key={gameKey} config={playConfig} onMenu={toMenu} onRules={() => setRulesOpen(true)} />
      )}
      {screen === 'puzzles' && (
        <PuzzleScreen key={gameKey} startIndex={puzzleStart} onMenu={toMenu} onRules={() => setRulesOpen(true)} />
      )}
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} rules={activeRules} />
    </div>
  );
}

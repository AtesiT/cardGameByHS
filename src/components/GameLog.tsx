import { useRef, useEffect } from 'react';

interface Props {
  log: string[];
}

export default function GameLog({ log }: Props) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // Group logs by turn
  const groupedLogs: { turn: string; entries: string[] }[] = [];
  let currentTurn = '';
  
  for (const entry of log) {
    if (entry.startsWith('---')) {
      currentTurn = entry;
      groupedLogs.push({ turn: entry, entries: [] });
    } else if (groupedLogs.length > 0) {
      groupedLogs[groupedLogs.length - 1].entries.push(entry);
    }
  }

  return (
    <div className="fixed right-4 top-20 bottom-20 w-72 flex flex-col gap-2 overflow-y-auto" ref={logRef}>
      <div className="text-amber-400 text-center mb-2" style={{ fontSize: '10px' }}>
        📜 ЖУРНАЛ БОЯ
      </div>
      
      {groupedLogs.slice(-10).map((group, groupIdx) => (
        <div key={groupIdx} className="bg-gray-900/90 border-2 border-amber-600 p-2">
          {/* Turn header */}
          <div className="text-amber-400 mb-1 border-b border-amber-700 pb-1" style={{ fontSize: '7px' }}>
            {group.turn}
          </div>
          
          {/* Log entries */}
          <div className="space-y-1">
            {group.entries.slice(-5).map((entry, entryIdx) => (
              <div
                key={entryIdx}
                className="relative group cursor-help bg-gray-800 border border-gray-700 px-2 py-1 hover:border-amber-500 transition-colors"
              >
                <div className="text-gray-300" style={{ fontSize: '6px' }}>
                  {entry}
                </div>
                
                {/* Tooltip on hover */}
                <div className="px-tooltip absolute bottom-full right-0 mb-2 w-56">
                  <p className="text-amber-400 font-bold mb-1" style={{ fontSize: '7px' }}>ДЕТАЛИ ДЕЙСТВИЯ</p>
                  <p className="text-gray-200" style={{ fontSize: '6px' }}>{entry}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

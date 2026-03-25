interface WeakWordListProps {
  words: string[];
}

export function WeakWordList({ words }: WeakWordListProps) {
  if (words.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        아직 데이터가 충분하지 않아요
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {words.map((word, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            i === 0 ? 'bg-red-400' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'
          }`}>
            {i + 1}
          </div>
          <span className="text-sm font-medium text-gray-700">{word}</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${i === 0 ? 'bg-red-400' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`}
              style={{ width: `${Math.max(20, 100 - i * 18)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

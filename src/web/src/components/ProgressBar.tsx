interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-slate-200/5 p-4 rounded-lg border border-slate-200/10">
      <div className="text-sm text-slate-400 mb-2">
        Progress:{" "}
        <span className="text-slate-200">
          {current} / {total}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

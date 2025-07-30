interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="glass p-4 rounded-lg">
      <div
        className="text-sm mb-2"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Progress:{" "}
        <span style={{ color: "hsl(var(--foreground))" }}>
          {current} / {total}
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "hsl(var(--muted))" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
                         background:
               "linear-gradient(to right, hsl(var(--primary)), hsl(142 75% 65%))",
          }}
        />
      </div>
    </div>
  );
}

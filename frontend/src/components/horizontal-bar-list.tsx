interface BarItem {
  label: string;
  value: number;
}

interface HorizontalBarListProps {
  items: BarItem[];
  valueFormatter?: (value: number) => string;
}

export function HorizontalBarList({ items, valueFormatter = String }: HorizontalBarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-sm text-muted-foreground" title={item.label}>
            {item.label}
          </span>
          <div className="h-3 rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-chart-1"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-right text-sm tabular-nums text-foreground">
            {valueFormatter(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

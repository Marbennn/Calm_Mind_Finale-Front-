// components/StressIndicator.jsx
export default function StressIndicator({ percent = 0, className = "" }) {
  const color =
    percent < 33 ? "bg-blue-500" : percent < 66 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`h-2 w-2 rounded-full ${color} ${percent >= 66 ? "animate-pulse" : ""}`} />
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-gray-600">{percent}%</span>
    </div>
  );
}

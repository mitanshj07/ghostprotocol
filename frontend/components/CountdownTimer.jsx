import { useEffect, useMemo, useState } from "react";

function formatTime(seconds) {
  if (seconds <= 0) return "Triggered";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export default function CountdownTimer({ secondsUntilTrigger = 0, totalWindow = 1, triggered = false }) {
  const [remaining, setRemaining] = useState(secondsUntilTrigger);

  useEffect(() => {
    setRemaining(secondsUntilTrigger);
  }, [secondsUntilTrigger]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const progress = useMemo(() => {
    if (triggered || totalWindow <= 0) return 0;
    return Math.max(0, Math.min(1, remaining / totalWindow));
  }, [remaining, totalWindow, triggered]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const color = triggered || remaining < 12 * 3600 ? "#D85A30" : remaining < 2 * 86400 ? "#EF9F27" : "#1D9E75";

  return (
    <section className="timer">
      <svg viewBox="0 0 190 190" role="img" aria-label="Vault countdown">
        <circle cx="95" cy="95" r={radius} className="timer-track" />
        <circle
          cx="95"
          cy="95"
          r={radius}
          className="timer-progress"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="timer-copy">
        <div className="timer-value">{formatTime(triggered ? 0 : remaining)}</div>
        <div className="eyebrow">{triggered ? "Execution window open" : "Until trigger"}</div>
      </div>
    </section>
  );
}

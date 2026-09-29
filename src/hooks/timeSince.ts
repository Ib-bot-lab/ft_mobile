import { useEffect, useState } from "react";

export const useTimeSince = () => {
  const [startTime] = useState(Date.now());

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100000);

    return () => clearInterval(interval);
  }, []);

  const secondsElapsed = Math.floor((now - startTime) / 1000);

  if (secondsElapsed < 60) {
    return `Updated ${secondsElapsed}secs ago`;
  }

  const minutesElapsed = Math.floor(secondsElapsed / 60);
  return `Updated ${minutesElapsed}m ${secondsElapsed % 60}s ago`;
};

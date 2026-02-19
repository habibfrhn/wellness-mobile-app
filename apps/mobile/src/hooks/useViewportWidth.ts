import { useEffect, useState } from "react";

export default function useViewportWidth() {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return width;
}

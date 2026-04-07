import { useEffect } from "react";

type Props = {
  onTokenChange: (token: string | null) => void;
  resetNonce: number;
};

export default function TurnstileCaptcha({ onTokenChange }: Props) {
  useEffect(() => {
    onTokenChange(null);
  }, [onTokenChange]);

  return null;
}

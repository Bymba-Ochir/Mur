import { Cat, Dog, PawPrint } from "lucide-react";
import type { PetType } from "../lib/types";

type PetIconProps = {
  type: PetType;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function PetIcon({
  type,
  size = 40,
  strokeWidth = 1.8,
  className,
}: PetIconProps) {
  const iconProps = {
    size,
    strokeWidth,
    className,
    "aria-hidden": true,
  } as const;

  if (type === "Нохой") return <Dog {...iconProps} />;
  if (type === "Муур") return <Cat {...iconProps} />;
  return <PawPrint {...iconProps} />;
}

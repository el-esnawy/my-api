import { MdContentCopy } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function CopyIcon({ size = 14, ...props }: IconBaseProps) {
  return <MdContentCopy size={size} {...props} />;
}

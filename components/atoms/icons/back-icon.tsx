import { MdArrowBack } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function BackIcon({ size = 20, ...props }: IconBaseProps) {
  return <MdArrowBack size={size} {...props} />;
}

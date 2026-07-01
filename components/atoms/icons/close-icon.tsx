import { MdClose } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function CloseIcon({ size = 18, ...props }: IconBaseProps) {
  return <MdClose size={size} {...props} />;
}

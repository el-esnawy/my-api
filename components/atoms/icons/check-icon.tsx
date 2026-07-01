import { MdCheck } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function CheckIcon({ size = 18, ...props }: IconBaseProps) {
  return <MdCheck size={size} {...props} />;
}

import { MdDeleteOutline } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function TrashIcon({ size = 16, ...props }: IconBaseProps) {
  return <MdDeleteOutline size={size} {...props} />;
}

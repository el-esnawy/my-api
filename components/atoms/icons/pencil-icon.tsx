import { MdEdit } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function PencilIcon({ size = 16, ...props }: IconBaseProps) {
  return <MdEdit size={size} {...props} />;
}

import { MdViewList } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function SchemaIcon({ size = 22, ...props }: IconBaseProps) {
  return <MdViewList size={size} {...props} />;
}

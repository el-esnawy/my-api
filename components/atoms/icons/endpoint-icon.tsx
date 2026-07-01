import { MdApi } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function EndpointIcon({ size = 22, ...props }: IconBaseProps) {
  return <MdApi size={size} {...props} />;
}

import { MdVpnKey } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function TokenIcon({ size = 22, ...props }: IconBaseProps) {
  return <MdVpnKey size={size} {...props} />;
}

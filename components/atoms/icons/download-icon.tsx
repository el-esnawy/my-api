import { MdFileDownload } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function DownloadIcon({ size = 16, ...props }: IconBaseProps) {
  return <MdFileDownload size={size} {...props} />;
}

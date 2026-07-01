import { MdFileUpload } from "react-icons/md";
import type { IconBaseProps } from "react-icons";

export function UploadIcon({ size = 16, ...props }: IconBaseProps) {
  return <MdFileUpload size={size} {...props} />;
}

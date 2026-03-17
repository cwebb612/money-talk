import { AnchorHTMLAttributes, ReactNode } from "react";
import { MoveUpRight } from "lucide-react";

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export default function ExternalLink({ children, className = "", style, ...props }: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:underline ${className}`}
      style={{ color: "var(--color-yellow)", ...style }}
      {...props}
    >
      {children}
      <MoveUpRight size={16}/>
    </a>
  );
}

import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "dark" | "ghost" | "outlineWhite" | "gold";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Button = ({
  children,
  variant = "primary",
  className,
  startIcon,
  endIcon,
  ...props
}: ButtonProps) => {
  const baseStyle =
    "h-12 px-8 cursor-pointer transition-all font-satoshi duration-300 font-medium tracking-[0.15em] text-xs uppercase flex items-center justify-center gap-2 border";

  const variants = {
    primary:
      "bg-[var(--color-gold)] text-white border-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] hover:border-[var(--color-gold-hover)]",
    gold: "bg-[var(--color-gold)] text-white border-[var(--color-gold)] hover:bg-white hover:text-[var(--color-gold)]",
    outline:
      "bg-transparent border-[var(--color-gold)] text-[var(--color-gold)] hover:border-[var(--color-light)]",
    outlineWhite:
      "bg-transparent border-white text-white hover:bg-white hover:text-[var(--color-dark)]",
    dark: "bg-[var(--color-dark)] text-white border-[var(--color-dark)] hover:bg-slate-800",
    ghost:
      "border-transparent text-slate-900 hover:text-[var(--color-gold)] p-0 h-auto bg-transparent",
  };

  return (
    <button className={cn(baseStyle, variants[variant], className)} {...props}>
      {startIcon && startIcon}
      {children}
      {endIcon && endIcon}
    </button>
  );
};

export default Button;

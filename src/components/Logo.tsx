import React from "react";
import { Leaf } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  subtitle?: boolean;
  title?: string;
  badge?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = "md", subtitle = true, title = "Nutri Tanzi", badge }) => {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex flex-col select-none">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 p-2">
          <Leaf className={iconSizes[size]} />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-tight text-slate-900 ${textSizes[size]}`}>
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>
      {subtitle && (
        <span className="text-xs font-medium text-emerald-800/70 tracking-wide mt-1">
          SISTEMA DE GESTÃO NUTRICIONAL
        </span>
      )}
    </div>
  );
};

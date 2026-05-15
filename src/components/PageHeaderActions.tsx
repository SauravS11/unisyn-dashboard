import type { ReactNode } from "react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface PageHeaderActionsProps {
  rightSlot?: ReactNode;
  showSignOut?: boolean;
  className?: string;
}

export const PageHeaderActions = ({
  rightSlot,
  showSignOut = true,
  className,
}: PageHeaderActionsProps) => {
  return (
    <>
      {showSignOut && (
        <div className={cn("absolute top-4 left-4 sm:top-6 sm:left-6 z-10", className)}>
          <SignOutButton />
        </div>
      )}
      <div className={cn("absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2", className)}>
        <ThemeToggle />
        {rightSlot}
      </div>
    </>
  );
};

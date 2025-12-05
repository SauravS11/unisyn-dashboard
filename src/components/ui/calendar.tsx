import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-base font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 transition-opacity inline-flex items-center justify-center",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex mb-2",
        head_cell: "text-muted-foreground w-10 font-medium text-sm",
        row: "flex w-full mt-1",
        cell: cn(
          "relative h-10 w-10 text-center text-sm p-0",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          "h-10 w-10 p-0 font-normal rounded-xl transition-all duration-200",
          "hover:bg-destructive/10 hover:text-destructive",
          "focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:ring-offset-1",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-destructive text-destructive-foreground shadow-lg",
          "hover:bg-destructive hover:text-destructive-foreground",
          "focus:bg-destructive focus:text-destructive-foreground",
          "rounded-xl"
        ),
        day_today: cn(
          "bg-destructive/20 text-destructive font-semibold rounded-full"
        ),
        day_outside: "day-outside text-muted-foreground/40 aria-selected:bg-destructive/50 aria-selected:text-destructive-foreground/80",
        day_disabled: "text-muted-foreground/30",
        day_range_middle: "aria-selected:bg-destructive/20 aria-selected:text-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

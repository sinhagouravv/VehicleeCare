import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

function Calendar({
    selected,
    onSelect,
    isDateDisabled,
    className
}) {
    const initialDate = selected ? new Date(selected) : new Date();
    const [currentMonth, setCurrentMonth] = useState(
        new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = selected ? new Date(selected) : null;
    if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const prevMonthDays = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        prevMonthDays.push({
            day: daysInPrevMonth - i,
            isCurrentMonth: false
        });
    }

    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push({
            day: i,
            isCurrentMonth: true,
            dateObj: new Date(year, month, i)
        });
    }

    const totalCells = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays = [];
    const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        nextMonthDays.push({
            day: i,
            isCurrentMonth: false
        });
    }

    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className={cn("w-[270px] bg-white border border-slate-200 rounded-2xl p-4 shadow-xl select-none font-sans text-left z-[200]", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <ChevronLeft size={16} strokeWidth={2} />
                </button>
                <span className="text-sm uppercase font-semibold text-[#011023]">
                    {monthName}
                </span>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    <ChevronRight size={16} strokeWidth={2} />
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {weekdays.map((wd) => (
                    <span key={wd} className="text-xs uppercase font-semibold text-slate-400 py-1">
                        {wd}
                    </span>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 text-center">
                {allDays.map((item, idx) => {
                    if (!item.isCurrentMonth) {
                        return (
                            <div key={idx} className="h-9 w-9 flex items-center justify-center mx-auto text-xs font-normal text-slate-300">
                                {item.day}
                            </div>
                        );
                    }

                    const isSelected = selectedDate && isSameDay(item.dateObj, selectedDate);
                    const isToday = isSameDay(item.dateObj, today);
                    const isDisabled = isDateDisabled ? isDateDisabled(item.dateObj) : false;

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => !isDisabled && onSelect && onSelect(item.dateObj)}
                            className={cn(
                                "h-8.25 w-8.25 rounded-xl flex flex-col items-center justify-center mx-auto text-xs transition-all relative",
                                isDisabled
                                    ? "text-slate-300 opacity-40 cursor-not-allowed"
                                    : isSelected
                                        ? "bg-[#18181b] text-white font-semibold shadow-xs cursor-pointer"
                                        : "text-[#011023] font-normal hover:bg-slate-100 cursor-pointer"
                            )}
                        >
                            <span className="leading-none">{item.day}</span>
                            {isSelected ? (
                                <span className="w-1 h-1 bg-white rounded-full mt-0.5" />
                            ) : isToday ? (
                                <span className={cn("w-1 h-1 rounded-full mt-0.5", isDisabled ? "bg-slate-300" : "bg-blue-600")} />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { Calendar };

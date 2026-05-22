"use client"
import { Tooltip, TooltipProps } from "recharts"
export const ChartTooltip = Tooltip
export const ChartTooltipContent = (props: any) => {
    // Basic tooltip for now to ensure it works
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
        return (
            <div className="p-2 text-xs bg-background border rounded-lg shadow-xl">
                <p className="font-bold">{label}</p>
                {payload.map((item: any, index: number) => (
                    <p key={index} style={{ color: item.color }}>{`${item.name}: ${item.value}`}</p>
                ))}
            </div>
        );
    }
    return null;
}
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Suggestion } from "@/hooks/use-task-suggestions"; // Import the type for a suggestion

interface SuggestionListProps {
  suggestions: Suggestion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title: string;
}

export function SuggestionList({
  suggestions,
  selectedId,
  onSelect,
  title,
}: SuggestionListProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-bold mb-2">{title}</h4>
      {suggestions.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground p-4">
          No available personnel match the required skills.
        </p>
      ) : (
        <div className="space-y-2">
          {suggestions.map((volunteer) => (
            <Button
              key={volunteer.id}
              variant={selectedId === volunteer.id ? "default" : "secondary"}
              className="w-full h-auto text-left flex flex-col items-start p-3"
              onClick={() => onSelect(volunteer.id)}
            >
              <div className="flex justify-between w-full items-center">
                <span className="font-semibold">{volunteer.name}</span>
                <span className="text-xs font-bold text-green-500">
                  {volunteer.score} pts
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {volunteer.reasons.map((reason) => (
                  <Badge key={reason} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

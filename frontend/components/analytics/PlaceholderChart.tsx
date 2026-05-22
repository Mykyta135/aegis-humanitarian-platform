"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

type Props = {
  title: string;
}

export function PlaceholderChart({ title }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          More data is needed from the backend to power this chart.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Chart coming soon</p>
      </CardContent>
    </Card>
  );
}
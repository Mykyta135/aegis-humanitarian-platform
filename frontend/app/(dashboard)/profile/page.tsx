"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/stores/use-auth.store";
import { useQuery } from "@tanstack/react-query";
import { User, MapPin, Star, CheckCircle2, Clock, Phone, Mail } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-orange-100 text-orange-800 border-orange-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};

const USER_STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  on_mission: "bg-orange-100 text-orange-800",
  unavailable: "bg-gray-100 text-gray-600",
};

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ["profile-missions", userId],
    queryFn: () => api.get(`/users/${userId}/tasks`).then((r) => r.data),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Not logged in.</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  const completedCount = missions.filter((m: any) => m.status === "completed").length;
  const inProgressCount = missions.filter((m: any) => m.status === "in_progress").length;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile?.name ?? "—"}</h1>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
        </div>
        {profile?.status && (
          <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full capitalize ${USER_STATUS_STYLES[profile.status] ?? "bg-gray-100 text-gray-600"}`}>
            {profile.status.replace("_", " ")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Role</p>
          <p className="font-semibold text-sm mt-0.5 capitalize">{profile?.role ?? currentUser.role}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="font-semibold text-sm mt-0.5 capitalize">{profile?.experienceLevel ?? "—"}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </p>
          <p className="font-semibold text-sm mt-0.5">{completedCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Active
          </p>
          <p className="font-semibold text-sm mt-0.5">{inProgressCount}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: string) => (
                <Badge key={s} variant="secondary" className="capitalize">
                  <Star className="h-3 w-3 mr-1" />
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No skills listed.</p>
          )}
        </CardContent>
      </Card>

      {profile?.homeBase && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Home Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">
              {profile.homeBase.lat.toFixed(4)}, {profile.homeBase.lng.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{currentUser.email}</span>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{profile.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {profile?.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mission History</CardTitle>
        </CardHeader>
        <CardContent>
          {missionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : missions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No missions yet.</p>
          ) : (
            <div className="space-y-2">
              {missions.map((m: any) => (
                <Link
                  key={m.id}
                  href={`/tasks/${m.id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-md border hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{m.region} · {m.priority}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${STATUS_STYLES[m.status] ?? ""}`}>
                    {m.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

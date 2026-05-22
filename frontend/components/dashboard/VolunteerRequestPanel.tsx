"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVolunteers } from "@/hooks/use-volunteers";
import {
  useTaskRequests,
  useSendVolunteerRequest,
  useRespondToRequest,
} from "@/hooks/use-volunteer-requests";
import { useAuthStore } from "@/stores/use-auth.store";
import { CheckCircle2, Send, XCircle, Clock } from "lucide-react";
import { useState } from "react";

const STATUS_STYLES = {
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  accepted: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-gray-100 text-gray-600 border-gray-300",
};

interface Props {
  taskId: string;
  taskStatus: string;
  creatorId?: string;
}

export function VolunteerRequestPanel({ taskId, taskStatus, creatorId }: Props) {
  const user = useAuthStore((s) => s.user);
  const isCreator = !!user && user.id === creatorId;
  const { data: requests = [], isLoading } = useTaskRequests(taskId);
  const { data: volunteers = [] } = useVolunteers({});
  const { mutate: send, isPending: sending } = useSendVolunteerRequest();
  const { mutate: respond, isPending: responding } = useRespondToRequest();

  const [targetId, setTargetId] = useState("");
  const [message, setMessage] = useState("");

  const isTerminal = taskStatus === "completed" || taskStatus === "cancelled";
  const availableVolunteers = volunteers.filter(
    (v) => v.status === "available" && v.id !== user?.id
  );

  const handleSend = () => {
    if (!targetId || !user?.id) return;
    send({ taskId, requesterId: user.id, targetId, message: message.trim() || undefined });
    setTargetId("");
    setMessage("");
  };

  return (
    <div className="space-y-4">
      {/* Existing requests */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No volunteer requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isTarget = user?.id === req.targetId;
            return (
              <div key={req.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {req.requester?.name ?? req.requesterId}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm font-medium">
                      {req.target?.name ?? req.targetId}
                    </span>
                    <Badge variant="outline" className={STATUS_STYLES[req.status]}>
                      {req.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {req.status === "accepted" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {req.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {req.status}
                    </Badge>
                  </div>
                  {req.message && (
                    <p className="text-xs text-muted-foreground">{req.message}</p>
                  )}
                </div>
                {isTarget && req.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                      disabled={responding}
                      onClick={() => respond({ id: req.id, userId: user!.id, accept: true })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      disabled={responding}
                      onClick={() => respond({ id: req.id, userId: user!.id, accept: false })}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Send new request — only creator can invite volunteers */}
      {!isTerminal && isCreator && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Send request to volunteer
          </p>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Choose volunteer…" />
            </SelectTrigger>
            <SelectContent>
              {availableVolunteers.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({v.skills.slice(0, 2).join(", ")})
                  </span>
                </SelectItem>
              ))}
              {availableVolunteers.length === 0 && (
                <SelectItem value="_none" disabled>No available volunteers</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message…"
            className="text-sm"
            rows={2}
          />
          <Button
            size="sm"
            className="w-full"
            disabled={!targetId || sending}
            onClick={handleSend}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {sending ? "Sending…" : "Send Request"}
          </Button>
        </div>
      )}
    </div>
  );
}

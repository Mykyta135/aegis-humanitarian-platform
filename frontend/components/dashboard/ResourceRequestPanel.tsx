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
import { useResources } from "@/hooks/use-resources";
import {
  useTaskResourceRequests,
  useSendResourceRequest,
  useRespondToResourceRequest,
} from "@/hooks/use-resource-requests";
import { useAuthStore } from "@/stores/use-auth.store";
import { CheckCircle2, Send, XCircle, Clock, Package } from "lucide-react";
import { useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-gray-100 text-gray-600 border-gray-300",
};

interface Props {
  taskId: string;
  taskStatus: string;
  creatorId?: string;
}

export function ResourceRequestPanel({ taskId, taskStatus, creatorId }: Props) {
  const user = useAuthStore((s) => s.user);
  const isCreator = !!user && user.id === creatorId;

  const { data: requests = [], isLoading } = useTaskResourceRequests(taskId);
  const { data: resources = [] } = useResources({});
  const { mutate: send, isPending: sending } = useSendResourceRequest();
  const { mutate: respond, isPending: responding } = useRespondToResourceRequest();

  const [resourceId, setResourceId] = useState("");
  const [message, setMessage] = useState("");

  const isTerminal = taskStatus === "completed" || taskStatus === "cancelled";
  const availableResources = resources.filter((r) => r.status === "available");

  const handleSend = () => {
    if (!resourceId) return;
    send({ taskId, resourceId, message: message.trim() || undefined });
    setResourceId("");
    setMessage("");
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No resource requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">
                    {req.resource?.name ?? req.resourceId}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {req.resource?.type}
                  </span>
                  <Badge variant="outline" className={STATUS_STYLES[req.status]}>
                    {req.status === "pending"  && <Clock        className="h-3 w-3 mr-1" />}
                    {req.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {req.status === "rejected" && <XCircle      className="h-3 w-3 mr-1" />}
                    {req.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requested by {req.requester?.name ?? req.requesterId}
                </p>
                {req.message && (
                  <p className="text-xs text-muted-foreground italic">"{req.message}"</p>
                )}
              </div>

              {isCreator && req.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                    disabled={responding}
                    onClick={() => respond({ id: req.id, approve: true })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    disabled={responding}
                    onClick={() => respond({ id: req.id, approve: false })}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isTerminal && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Request a resource
          </p>
          <Select value={resourceId} onValueChange={setResourceId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Choose resource…" />
            </SelectTrigger>
            <SelectContent>
              {availableResources.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                  <span className="ml-2 text-xs text-muted-foreground capitalize">({r.type})</span>
                </SelectItem>
              ))}
              {availableResources.length === 0 && (
                <SelectItem value="_none" disabled>No available resources</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional note about why this resource is needed…"
            className="text-sm"
            rows={2}
          />
          <Button
            size="sm"
            className="w-full"
            disabled={!resourceId || sending}
            onClick={handleSend}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {sending ? "Sending…" : "Send Resource Request"}
          </Button>
        </div>
      )}
    </div>
  );
}

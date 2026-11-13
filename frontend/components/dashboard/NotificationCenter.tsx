"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useNotificationsStore,
  type Notification,
} from "@/stores/use-notifications.store";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Users,
  Package,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { connectSocket } from "@/lib/socket";

const SEVERITY_ICON: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
};

const SEVERITY_COLOR: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  success: "text-green-500",
  error: "text-red-500",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  task_created: ClipboardList,
  task_completed: CheckCircle2,
  task_cancelled: XCircle,
  volunteer_added: Users,
  resource_added: Package,
  status_change: Info,
  alert: AlertTriangle,
};

function getNotificationHref(notification: Notification): string | null {
  const meta = notification.meta as Record<string, string> | undefined;
  switch (notification.type) {
    case "task_created":
    case "task_completed":
    case "task_cancelled":
    case "status_change":
      return meta?.taskId ? `/tasks/${meta.taskId}` : "/map";
    case "volunteer_added":
      return meta?.userId ? `/volunteers/${meta.userId}` : "/manage";
    case "resource_added":
      return "/manage";
    case "alert":
      return "/map";
    default:
      return null;
  }
}

function NotificationItem({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const { markRead } = useNotificationsStore();
  const router = useRouter();
  const Icon = TYPE_ICON[notification.type] ?? SEVERITY_ICON[notification.severity] ?? Info;
  const color = SEVERITY_COLOR[notification.severity] ?? "text-muted-foreground";
  const href = getNotificationHref(notification);

  const handleClick = () => {
    markRead(notification.id);
    if (href) {
      onClose();
      router.push(href);
    }
  };

  return (
    <button
      className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex gap-3 group ${
        notification.read ? "opacity-60" : ""
      } ${href ? "cursor-pointer" : "cursor-default"}`}
      onClick={handleClick}
    >
      <div className={`shrink-0 mt-0.5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-xs font-semibold leading-tight">{notification.title}</p>
          {href && (
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="shrink-0 mt-1">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </button>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, addNotification, markAllRead, clearAll } =
    useNotificationsStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    const handleNotification = (payload: Omit<Notification, "read">) => {
      addNotification(payload);
    };
    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
      socket.disconnect();
    };
  }, [addNotification]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  deal_id: string | null;
  deal_name?: string;
}

export const NotificationButton = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    // Fetch deal names for notifications with deal_id
    const notificationsWithDealNames = await Promise.all(
      (notifications || []).map(async (notification) => {
        if (notification.deal_id) {
          const { data: deal } = await supabase
            .from("deals")
            .select("name")
            .eq("id", notification.deal_id)
            .single();
          
          return { ...notification, deal_name: deal?.name };
        }
        return notification;
      })
    );

    setNotifications(notificationsWithDealNames);
    setUnreadCount(notificationsWithDealNames.filter((n) => !n.read).length || 0);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    fetchNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    
    if (notification.deal_id) {
      navigate(`/deals/${notification.deal_id}/dashboard`);
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    fetchNotifications();
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    fetchNotifications();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative backdrop-blur-xl bg-background/50 border-border/50 hover:bg-background/80">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs flex items-center justify-center shadow-lg animate-scale-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 backdrop-blur-2xl bg-background/80 border-border/50 shadow-2xl animate-scale-in" align="end">
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <h3 className="font-bold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[450px]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative p-4 hover:bg-accent/30 transition-all ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-primary/80 mt-2 flex-shrink-0 shadow-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1">{notification.title}</p>
                        {notification.deal_name && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                            Deal: {notification.deal_name}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteNotification(notification.id, e)}
                    className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

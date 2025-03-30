// client/src/components/common/NotificationContainer.jsx

import React from "react";
import { useUI } from "../../hooks/useUI";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const NotificationContainer = () => {
  const { notifications, removeNotification } = useUI();

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={notification.type || "default"}
          className="max-w-md animate-slideIn"
        >
          <div className="flex justify-between items-start">
            <div>
              {notification.title && (
                <AlertTitle>{notification.title}</AlertTitle>
              )}
              <AlertDescription>{notification.message}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default NotificationContainer;

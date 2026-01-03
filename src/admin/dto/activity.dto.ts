export interface RecentActivityItem {
  action: string;
  user: string;
  time: string;
  type: 'application' | 'booking' | 'payment' | 'registration';
}

export interface PlatformAlert {
  type: 'warning' | 'info' | 'error';
  message: string;
  details: string;
  actionText: string;
}
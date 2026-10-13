import { playAlertSound } from './audio';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export async function sendWebNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: unknown;
    playAudio?: boolean;
  }
): Promise<boolean> {
  if (options?.playAudio !== false) {
    playAlertSound();
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultIcon = '/icon-192.png';
  const defaultBadge = '/badge-96.png';

  // Try service worker first for background support
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        const notifOpts: NotificationOptions & { renotify?: boolean } = {
          body: options?.body || 'มีโค้ดใหม่พร้อมใช้งานแล้ว',
          icon: options?.icon || defaultIcon,
          badge: defaultBadge,
          tag: options?.tag || 'opm-code-alert',
          renotify: false,
          data: options?.data || { url: window.location.href }
        };
        await reg.showNotification(title, notifOpts);
        return true;
      }
    } catch {
      // Fallback to standard window Notification
    }
  }

  try {
    const notif = new Notification(title, {
      body: options?.body || 'มีโค้ดใหม่พร้อมใช้งานแล้ว',
      icon: options?.icon || defaultIcon,
      tag: options?.tag || 'opm-code-alert'
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (error) {
    console.error('Native Notification instantiation failed:', error);
    return false;
  }
}

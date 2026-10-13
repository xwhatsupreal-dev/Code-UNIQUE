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

  const defaultIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23facc15"/><text x="50" y="65" font-size="40" text-anchor="middle" font-weight="900" fill="%23dc2626">OPM</text></svg>';

  // Try service worker first for background support
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options?.body || 'มีโค้ดใหม่เข้ามาแล้ว!',
          icon: options?.icon || defaultIcon,
          badge: defaultIcon,
          tag: options?.tag || 'opm-code-alert',
          data: options?.data || { url: window.location.href }
        });
        return true;
      }
    } catch {
      // Fallback to standard window Notification
    }
  }

  try {
    const notif = new Notification(title, {
      body: options?.body || 'มีโค้ดใหม่เข้ามาแล้ว!',
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

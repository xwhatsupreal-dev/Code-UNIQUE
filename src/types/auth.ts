export const AUTHORIZED_ADMIN_EMAIL = 'teerasit.thanwa@gmail.com';

export interface AdminAuthState {
  currentUserEmail: string | null;
  isAdmin: boolean;
  isGuestPreview: boolean;
}

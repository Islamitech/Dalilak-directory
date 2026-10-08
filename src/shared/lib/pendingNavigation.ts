/**
 * Tiny hand-off between "Directions" buttons that live outside the map (detail modal, cards) and the
 * map screen, which may not be mounted yet when the button is pressed. The button records which activity
 * should start in-app navigation; the map consumes the request once it shows that activity.
 */
let pendingBusinessId: string | null = null;

export function requestBusinessNavigation(businessId: string): void {
  pendingBusinessId = businessId;
}

/** Returns true (once) if navigation to this activity was requested. */
export function consumeBusinessNavigation(businessId: string): boolean {
  if (pendingBusinessId && pendingBusinessId === businessId) {
    pendingBusinessId = null;
    return true;
  }
  return false;
}

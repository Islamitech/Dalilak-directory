/**
 * Tiny hand-off between "Directions" buttons that live outside the map (detail modal, cards) and the
 * map screen, which may not be mounted yet when the button is pressed. The button records which activity
 * should start in-app navigation; the map consumes the request once it shows that activity.
 */
let pendingBusinessId: string | null = null;
let pendingGateId: string | null = null;

export function requestBusinessNavigation(businessId: string, gateId?: string): void {
  pendingBusinessId = businessId;
  pendingGateId = gateId ?? null;
}

/** Returns whether navigation to this activity was requested, and the entry gate if one was chosen. */
export function consumeBusinessNavigation(businessId: string): { matched: boolean; gateId: string | null } {
  if (!pendingBusinessId || pendingBusinessId !== businessId) {
    return { matched: false, gateId: null };
  }
  pendingBusinessId = null;
  const gateId = pendingGateId;
  pendingGateId = null;
  return { matched: true, gateId };
}

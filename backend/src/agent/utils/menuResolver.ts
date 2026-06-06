import { getMenu } from "../tools";
import { sessionService } from "../../services/SessionService";
import type { MenuItemCandidate } from "./menuItemMatcher";
import type { SessionMenuItem } from "../../types/session";

export async function resolveMenuCandidates(
  sessionId: string,
  restaurantId: string
): Promise<MenuItemCandidate[]> {
  const cached = sessionService
    .getLastViewedMenuItems(sessionId)
    .filter((item) => item.restaurantId === restaurantId);

  if (cached.length > 0) {
    return cached.map(({ id, name }) => ({ id, name }));
  }

  const menuResult = await getMenu({ restaurantId });
  if (!menuResult.success || menuResult.data.length === 0) {
    return [];
  }

  const items: SessionMenuItem[] = menuResult.data.map((item) => ({
    id: item.id,
    name: item.name,
    restaurantId,
  }));

  sessionService.setLastViewedMenuItems(sessionId, items);
  return items.map(({ id, name }) => ({ id, name }));
}

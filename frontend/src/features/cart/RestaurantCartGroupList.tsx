import type { MockRestaurantGroup } from "@/features/session/sessionState";
import { RestaurantCartGroup } from "./RestaurantCartGroup";

type RestaurantCartGroupListProps = {
  groups: MockRestaurantGroup[];
};

export function RestaurantCartGroupList({ groups }: RestaurantCartGroupListProps) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <RestaurantCartGroup group={group} key={group.id} />
      ))}
    </div>
  );
}

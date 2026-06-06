export type SelectRestaurantResult = {
  success: boolean;
  data: { id: string; name: string } | null;
  error?: string;
};

import { useRouteLoaderData } from "react-router";
import { DEFAULT_DELIVERY, type DeliveryRule } from "../domain/delivery";

// The shop's delivery rule, as loaded from the admin settings by the root loader.
export function useDelivery(): DeliveryRule {
  const data = useRouteLoaderData("root") as { delivery?: DeliveryRule } | undefined;
  return data?.delivery || DEFAULT_DELIVERY;
}

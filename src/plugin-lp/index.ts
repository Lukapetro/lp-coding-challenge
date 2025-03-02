import { lpPositions } from "./actions/lpPositions.ts";
import { LPPositionService } from "./services/lpPositionService.ts";

export const lpPositionsPlugin = {
  name: "lpPositions",
  description: "Track and analyze Uniswap LP positions",
  actions: [lpPositions],
  evaluators: [],
  providers: [],
  services: [new LPPositionService() as any],
  clients: [],
  adapters: [],
};

export default lpPositionsPlugin;

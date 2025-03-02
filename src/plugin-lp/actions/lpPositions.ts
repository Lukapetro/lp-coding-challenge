import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  elizaLogger,
} from "@elizaos/core";
import { LPPositionService } from "../services/lpPositionService.ts";
import type { LPPositionResponse } from "../types.ts";

export const lpPositions: Action = {
  name: "LP_POSITIONS",
  similes: [
    "LIQUIDITY_POSITIONS",
    "UNISWAP_POSITIONS",
    "LP_PNL",
    "LIQUIDITY_PNL",
    "CHECK_LP",
    "TRACK_LP",
    "POOL_POSITIONS",
    "UNISWAP_LP",
  ],
  suppressInitialMessage: true,
  description:
    "Fetch and analyze Uniswap LP positions for a given wallet address.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // No specific API key required for now, but we could add validation here
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    elizaLogger.log("Composing state for message:", message);
    state = (await runtime.composeState(message)) as State;
    const userId = runtime.agentId;
    elizaLogger.log("User ID:", userId);

    // Extract wallet address from the message
    const messageText = message.content.text.trim();
    elizaLogger.log("Message received:", messageText);

    // Look for an Ethereum address pattern in the message
    const addressMatch = messageText.match(/0x[a-fA-F0-9]{40}/);

    if (!addressMatch) {
      callback({
        text: "Please provide a valid Ethereum wallet address (0x followed by 40 hexadecimal characters).",
      });
      return;
    }

    const walletAddress = addressMatch[0];
    elizaLogger.log("Wallet address extracted:", walletAddress);

    const lpPositionService = new LPPositionService();
    await lpPositionService.initialize(runtime);
    const positionsResponse = await lpPositionService.fetchPositions(
      walletAddress
    );

    if (positionsResponse && positionsResponse.positions.length) {
      const formattedResponse = formatPositions(positionsResponse);
      callback({
        text: formattedResponse,
      });
    } else {
      callback({
        text: `No LP positions found for wallet address ${walletAddress} or there was an error fetching the data.`,
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "0x1234567890123456789012345678901234567890",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here are the LP positions for 0x1234567890123456789012345678901234567890:",
          action: "LP_POSITIONS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check my LP positions: 0xabcdef1234567890abcdef1234567890abcdef12",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here are your Uniswap LP positions:",
          action: "LP_POSITIONS",
        },
      },
    ],
  ],
} as Action;

function formatPositions(response: LPPositionResponse): string {
  if (!response.positions || response.positions.length === 0) {
    return `No LP positions found for wallet address ${response.walletAddress} or there was an error fetching the data.`;
  }

  let result = `# LP Positions for ${response.walletAddress}\n\n`;
  result += `Total PnL: **${response.totalPnlUsd}** USD\n\n`;

  response.positions.forEach((position, index) => {
    // Better token name extraction
    let token0 = position.token0.symbol;
    let token1 = position.token1.symbol;

    // Clean up token names by removing extra information
    if (token0.includes(" - ")) {
      const parts = token0.split(" - ");
      // Check if the first part is "Uniswap"
      if (parts[0].toLowerCase() === "uniswap") {
        // Use the second part as the token name
        token0 = parts.length > 1 ? parts[1] : parts[0];
      } else {
        token0 = parts[0];
      }
    }

    if (token1.includes(" - ")) {
      const parts = token1.split(" - ");
      if (parts[0].toLowerCase() === "uniswap") {
        token1 = parts.length > 1 ? parts[1] : parts[0];
      } else {
        token1 = parts[0];
      }
    }

    // Remove tick range information if present
    token0 = token0.split("<>")[0].trim();
    token1 = token1.split("<>")[0].trim();

    // Add a horizontal rule between positions (except before the first one)
    if (index > 0) {
      result += `---\n\n`;
    }

    result += `## ${token0}/${token1} ${position.id}\n`;

    // Extract fee tier if available
    let feeTier = "";
    if (position.token0.symbol.includes("%")) {
      feeTier = position.token0.symbol.match(/(\d+\.\d+)%/)?.[0] || "";
    } else if (position.token1.symbol.includes("%")) {
      feeTier = position.token1.symbol.match(/(\d+\.\d+)%/)?.[0] || "";
    }

    if (feeTier) {
      result += `Fee Tier: ${feeTier}\n`;
    }

    result += `\n### Deposited Amounts\n`;
    result += `- ${position.depositedAmount0} ${token0}\n`;
    result += `- ${position.depositedAmount1} ${token1}\n\n`;

    result += `### Current Amounts\n`;
    result += `- ${position.currentAmount0} ${token0}\n`;
    result += `- ${position.currentAmount1} ${token1}\n\n`;

    result += `### PnL\n`;
    result += `- ${token0}: ${position.pnl.token0}\n`;
    result += `- ${token1}: ${position.pnl.token1}\n`;
    result += `- USD: ${position.pnl.usd}\n`;
    result += `- Percentage: ${position.pnl.percentage}\n\n`;
  });

  return result;
}

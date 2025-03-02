import type { Service } from "@elizaos/core";

export interface IWebSearchService extends Service {
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate?: string;
};

export type SearchImage = {
  url: string;
  description?: string;
};

export type SearchResponse = {
  answer?: string;
  query: string;
  responseTime: number;
  images: SearchImage[];
  results: SearchResult[];
};

export interface SearchOptions {
  limit?: number;
  type?: "news" | "general";
  includeAnswer?: boolean;
  searchDepth?: "basic" | "advanced";
  includeImages?: boolean;
  days?: number; // 1 means current day, 2 means last 2 days
}

export interface ILPPositionService extends Service {
  fetchPositions(walletAddress: string): Promise<LPPositionResponse | null>;
}

export interface LPPosition {
  id: string;
  token0: {
    symbol: string;
    address: string;
  };
  token1: {
    symbol: string;
    address: string;
  };
  liquidity: string;
  depositedAmount0: string;
  depositedAmount1: string;
  currentAmount0: string;
  currentAmount1: string;
  pnl: {
    token0: string;
    token1: string;
    usd: string;
    percentage: string;
  };
}

export interface LPPositionResponse {
  walletAddress: string;
  positions: LPPosition[];
  totalPnlUsd: string;
}

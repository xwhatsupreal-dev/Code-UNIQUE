export type ServerRegion = 'SEA';

export type CodeStatus = 'ACTIVE' | 'EXPIRED' | 'LIMITED';

export interface CodeReward {
  type: 'gems' | 'tickets' | 'coins' | 'vitality' | 'exp' | 'item';
  name: string;
  amount: number;
  icon?: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  server: ServerRegion;
  status: CodeStatus;
  rewards: CodeReward[];
  description: string;
  addedAt: string;
  expiresAt: string | null;
  verifiedWorking: boolean;
  workingVotes: number;
  expiredVotes: number;
  isNew?: boolean;
  isHot?: boolean;
  minLevel?: number;
  addedAtTimestamp?: number;
  sourceOrder?: number;
}


export interface ActivityEvent {
  id: string;
  type: 'redeemed' | 'new_code' | 'verified' | 'expiring';
  user: string;
  code: string;
  timestamp: string;
  detail: string;
}

export interface WaiverReason {
  id: string;
  tenantId: string;
  coverageType: string;
  waiverReasonCode: string;
  waiverReasonDescription: string;
  waiverReasonStatus: number;
  isSelectable: boolean;
}

export const waiverReasonsInitialState = (): WaiverReason[] => [];

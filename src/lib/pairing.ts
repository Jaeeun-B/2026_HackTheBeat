import type { Assignment } from './assign';

export interface PartnerConnection {
  partnerName: string;
  pairId: string;
}

export function getPartnerConnection(assignments: Assignment[], currentIndex: number): PartnerConnection | null {
  const current = assignments[currentIndex];
  if (!current || !current.pairId || current.partnerIndex === null) {
    return null;
  }
  
  if (current.partnerIndex < currentIndex) {
    const partner = assignments[current.partnerIndex];
    return {
      partnerName: partner.name,
      pairId: current.pairId
    };
  }
  
  return null;
}

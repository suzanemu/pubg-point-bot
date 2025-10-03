export interface Team {
  id: string;
  name: string;
  totalPoints: number;
  placementPoints: number;
  killPoints: number;
  matches: number;
}

export interface Match {
  id: string;
  teamId: string;
  placement: number;
  kills: number;
  placementPoints: number;
  matchNumber: number;
}

export const PLACEMENT_POINTS: Record<number, number> = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
};

export const getPlacementPoints = (placement: number): number => {
  if (placement >= 1 && placement <= 8) {
    return PLACEMENT_POINTS[placement] || 0;
  }
  return 0;
};

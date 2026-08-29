export interface Mission {
  id: string;
  text: string;
  difficulty: number;
}

export interface Pair {
  pairId: string;
  a: Mission;
  b: Mission;
  link: string;
}

export interface Deck {
  pairs: Pair[];
  solos: Mission[];
}

export interface Assignment {
  name: string;
  mission: Mission;
  pairId: string | null;
  partnerIndex: number | null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assign(names: string[], deck: Deck, seed: string | number, carryOverMissions?: Mission[]): Assignment[] {
  const seedNum = typeof seed === 'string' ? hashString(seed) : seed;
  const random = mulberry32(seedNum);

  const shuffle = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const shuffledPairs = shuffle(deck.pairs);

  const finalAssignments: Assignment[] = names.map((name) => ({
    name,
    mission: { id: '', text: '', difficulty: 0 },
    pairId: null,
    partnerIndex: null,
  }));

  const slots = shuffle(Array.from({ length: names.length }, (_, i) => i));

  // Assign carried over missions first
  if (carryOverMissions) {
    const shuffledCarryOver = shuffle([...carryOverMissions]);
    for (const mission of shuffledCarryOver) {
      if (slots.length === 0) break;
      const slot = slots.pop()!;
      finalAssignments[slot].mission = mission;
    }
  }

  let pairIndex = 0;
  let soloIndex = 0;
  const poolSolos = shuffle(deck.solos);

  while (slots.length >= 2 && pairIndex < shuffledPairs.length) {
    const slotA = slots.pop()!;
    const slotB = slots.pop()!;
    const pair = shuffledPairs[pairIndex++];

    if (random() > 0.5) {
      finalAssignments[slotA].mission = pair.a;
      finalAssignments[slotB].mission = pair.b;
    } else {
      finalAssignments[slotA].mission = pair.b;
      finalAssignments[slotB].mission = pair.a;
    }

    finalAssignments[slotA].pairId = pair.pairId;
    finalAssignments[slotA].partnerIndex = slotB;
    finalAssignments[slotB].pairId = pair.pairId;
    finalAssignments[slotB].partnerIndex = slotA;
  }

  while (slots.length > 0) {
    const slot = slots.pop()!;
    let mission: Mission;
    if (soloIndex < poolSolos.length) {
      mission = poolSolos[soloIndex++];
    } else {
      mission = poolSolos[soloIndex % poolSolos.length];
      soloIndex++;
    }
    finalAssignments[slot].mission = mission;
  }

  return finalAssignments;
}

import { FriendProfile } from '../types';

export interface CompatibilityResult {
  score: number; // Porcentaje de 50% a 99%
  sharedTraits: string[];
  reasons: string[];
  affinityLevel: 'Excepcional' | 'Muy Alta' | 'Buena' | 'Compañero Escolar';
}

/**
 * Extracts key normalized words from a text string (excluding common stop words).
 */
function extractKeywords(text: string | undefined): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'de', 'la', 'el', 'los', 'las', 'y', 'o', 'en', 'con', 'para', 'un', 'una', 
    'unos', 'unas', 'del', 'al', 'mi', 'mis', 'me', 'gusta', 'mucho', 'tipo', 'estilo'
  ]);
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents for robust comparison
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Calculates a genuine, dynamic compatibility score between two school community members.
 * If referenceUser is not provided or incomplete, returns a friendly default based on target's profile.
 */
export function calculateCompatibility(
  targetUser: FriendProfile,
  referenceUser?: FriendProfile | null
): CompatibilityResult {
  // If target is looking at their own profile, it's 100%
  if (referenceUser && (referenceUser.id === targetUser.id || (referenceUser.email && referenceUser.email === targetUser.email))) {
    return {
      score: 100,
      sharedTraits: targetUser.traits || [],
      reasons: ['¡Eres tú! Tu propio perfil escolar.'],
      affinityLevel: 'Perfecta' as any
    };
  }

  // Base score for being members of the same school community
  let baseScore = 55;
  const reasons: string[] = [];

  if (!referenceUser) {
    // If no user is logged in, use the target's stored score or a default baseline
    const fallbackScore = targetUser.matchScore || 85;
    return {
      score: fallbackScore,
      sharedTraits: [],
      reasons: ['Compatibilidad estimada con la comunidad escolar.'],
      affinityLevel: fallbackScore >= 90 ? 'Muy Alta' : 'Buena'
    };
  }

  // 1. Common Traits / Interests (up to 25 points)
  const refTraits = (referenceUser.traits || []).map(t => t.trim().toUpperCase());
  const targetTraits = (targetUser.traits || []).map(t => t.trim().toUpperCase());
  
  const sharedTraits = targetTraits.filter(trait => 
    refTraits.some(refT => refT === trait || refT.includes(trait) || trait.includes(refT))
  );

  if (sharedTraits.length > 0) {
    const traitPoints = Math.min(25, sharedTraits.length * 9);
    baseScore += traitPoints;
    const formattedTraits = sharedTraits.slice(0, 3).join(', ');
    reasons.push(`Intereses compartidos: ${formattedTraits}`);
  }

  // 2. Favorite Food affinities (up to 15 points)
  const refFoodWords = extractKeywords(referenceUser.favoriteFood);
  const targetFoodWords = extractKeywords(targetUser.favoriteFood);
  const sharedFood = refFoodWords.filter(word => targetFoodWords.includes(word));

  if (sharedFood.length > 0) {
    baseScore += 15;
    reasons.push(`Coinciden en gustos de comida (${sharedFood[0]})`);
  } else if (referenceUser.favoriteFood && targetUser.favoriteFood) {
    // Both filled out food preference
    baseScore += 5;
  }

  // 3. Meme / Humor Style affinities (up to 15 points)
  const refMemeWords = extractKeywords(referenceUser.favoriteMemeStyle);
  const targetMemeWords = extractKeywords(targetUser.favoriteMemeStyle);
  const sharedMemes = refMemeWords.filter(word => targetMemeWords.includes(word));

  if (sharedMemes.length > 0) {
    baseScore += 15;
    reasons.push(`Mismo sentido del humor (${sharedMemes[0]})`);
  } else if (referenceUser.favoriteMemeStyle && targetUser.favoriteMemeStyle) {
    baseScore += 4;
  }

  // 4. Geographic proximity / Same City (up to 10 points)
  if (
    referenceUser.city && 
    targetUser.city && 
    referenceUser.city.trim().toLowerCase() === targetUser.city.trim().toLowerCase()
  ) {
    baseScore += 10;
    reasons.push(`Misma ubicación: ${targetUser.city.trim()}`);
  }

  // 5. Shared Events or Groups (up to 10 points)
  if (
    referenceUser.joinedEvent && 
    targetUser.joinedEvent && 
    referenceUser.joinedEvent.trim().toLowerCase() === targetUser.joinedEvent.trim().toLowerCase()
  ) {
    baseScore += 8;
    reasons.push(`Coinciden en el evento "${targetUser.joinedEvent}"`);
  } else if (
    referenceUser.joinedGroup && 
    targetUser.joinedGroup && 
    referenceUser.joinedGroup.trim().toLowerCase() === targetUser.joinedGroup.trim().toLowerCase()
  ) {
    baseScore += 6;
    reasons.push(`Pertenecen al grupo "${targetUser.joinedGroup}"`);
  }

  // 6. Age proximity (within 3 years -> +5 points)
  if (referenceUser.age && targetUser.age) {
    const ageDiff = Math.abs(referenceUser.age - targetUser.age);
    if (ageDiff <= 3) {
      baseScore += 5;
      reasons.push('Edad y etapa escolar afín');
    }
  }

  // Clamp final score between 55% and 99%
  const finalScore = Math.min(99, Math.max(55, Math.round(baseScore)));

  let affinityLevel: CompatibilityResult['affinityLevel'] = 'Buena';
  if (finalScore >= 92) {
    affinityLevel = 'Excepcional';
  } else if (finalScore >= 80) {
    affinityLevel = 'Muy Alta';
  } else if (finalScore >= 65) {
    affinityLevel = 'Buena';
  } else {
    affinityLevel = 'Compañero Escolar';
  }

  if (reasons.length === 0) {
    reasons.push('Ambos forman parte activa de la comunidad escolar');
  }

  return {
    score: finalScore,
    sharedTraits,
    reasons,
    affinityLevel
  };
}

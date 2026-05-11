export function normalizeRecommendation(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function recommendationKey(value) {
  return normalizeRecommendation(value).toLowerCase();
}

export function toTitleCase(value) {
  return normalizeRecommendation(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function firstUnusedRecommendation(candidates, usedValues) {
  const usedKeys = new Set(usedValues.map(recommendationKey));
  return candidates.find((candidate) => !usedKeys.has(recommendationKey(candidate)));
}

export function toBasicNeedOption(value) {
  const normalizedValue = normalizeRecommendation(value).toLowerCase();
  const label = toTitleCase(normalizedValue);

  return {
    label,
    to: '/patient/final-answer',
    state: {
      source: 'basic-needs',
      request: label,
      path: ['basic_needs', normalizedValue],
    },
  };
}

export function toCommunicationOption(value) {
  const normalizedValue = normalizeRecommendation(value).toLowerCase();
  const target = normalizedValue.replace(/^call\s+/, '').trim() || normalizedValue;
  const label = toTitleCase(target);

  return {
    label,
    to: '/patient/final-answer',
    state: {
      source: 'communication',
      request: label,
      path: ['communication', normalizedValue],
    },
  };
}

export function toPainOption(value) {
  const normalizedValue = normalizeRecommendation(value).toLowerCase();
  const area = normalizedValue
    .replace(/\s+pain$/, '')
    .replace(/^pain\s+/, '')
    .trim() || normalizedValue;
  const label = toTitleCase(area);

  return {
    label,
    to: '/patient/pain/intensity',
    state: { area: label },
  };
}

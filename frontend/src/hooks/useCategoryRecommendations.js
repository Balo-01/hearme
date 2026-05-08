import { useEffect, useMemo, useState } from 'react';
import { usePatient } from '../context/PatientContext';
import { DEFAULT_PATIENT_ID, getRecommendations } from '../services/requestsApi';
import { normalizeRecommendation, recommendationKey } from '../utils/recommendationOptions';

const recommendationCache = new Map();
const inFlightRecommendations = new Map();

function normalizeCategory(category) {
  return String(category || '').trim().toLowerCase().replace(/-/g, '_');
}

function mergeWithFallback(recommendations, fallbackRecommendations) {
  const seen = new Set();
  const merged = [];

  [...(recommendations || []), ...fallbackRecommendations].forEach((value) => {
    const normalizedValue = normalizeRecommendation(value);
    const key = recommendationKey(normalizedValue);

    if (!normalizedValue || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(normalizedValue);
  });

  return merged.slice(0, 3);
}

function loadRecommendations(patientId, category) {
  const cacheKey = `${patientId}:${category}`;

  if (recommendationCache.has(cacheKey)) {
    return Promise.resolve(recommendationCache.get(cacheKey));
  }

  if (inFlightRecommendations.has(cacheKey)) {
    return inFlightRecommendations.get(cacheKey);
  }

  const request = getRecommendations(patientId, category)
    .then((data) => {
      const recommendations = Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];
      recommendationCache.set(cacheKey, recommendations);
      return recommendations;
    })
    .finally(() => {
      inFlightRecommendations.delete(cacheKey);
    });

  inFlightRecommendations.set(cacheKey, request);
  return request;
}

export default function useCategoryRecommendations(category, fallbackRecommendations) {
  const { patientId } = usePatient();
  const effectivePatientId = patientId || DEFAULT_PATIENT_ID;
  const normalizedCategory = normalizeCategory(category);
  const cacheKey = `${effectivePatientId}:${normalizedCategory}`;
  const fallbackList = useMemo(
    () => mergeWithFallback([], fallbackRecommendations),
    [fallbackRecommendations],
  );
  const [result, setResult] = useState({
    cacheKey: null,
    recommendations: fallbackList,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    loadRecommendations(effectivePatientId, normalizedCategory)
      .then((loadedRecommendations) => {
        if (isCancelled) {
          return;
        }

        setResult({
          cacheKey,
          recommendations: mergeWithFallback(loadedRecommendations, fallbackList),
          error: null,
        });
      })
      .catch((err) => {
        if (isCancelled) {
          return;
        }

        console.error('Failed to load category recommendations:', err);
        setResult({
          cacheKey,
          recommendations: fallbackList,
          error: err,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, effectivePatientId, fallbackList, normalizedCategory]);

  const isCurrentResult = result.cacheKey === cacheKey;

  return {
    recommendations: isCurrentResult ? result.recommendations : fallbackList,
    isLoading: !isCurrentResult,
    error: isCurrentResult ? result.error : null,
  };
}

import { useEffect, useMemo, useState } from 'react';
import { usePatient } from '../context/PatientContext';
import { DEFAULT_PATIENT_ID, getRecommendations } from '../services/requestsApi';
import { normalizeRecommendation, recommendationKey } from '../utils/recommendationOptions';

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
  return getRecommendations(patientId, category)
    .then((data) => {
      const recommendations = Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];
      const summary = typeof data?.summary === 'string' ? data.summary : '';
      return { recommendations, summary };
    });
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
    summary: '',
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    loadRecommendations(effectivePatientId, normalizedCategory)
      .then(({ recommendations: loadedRecommendations, summary }) => {
        if (isCancelled) {
          return;
        }

        setResult({
          cacheKey,
          recommendations: mergeWithFallback(loadedRecommendations, fallbackList),
          summary,
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
          summary: '',
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
    summary: isCurrentResult ? result.summary : '',
    isLoading: !isCurrentResult,
    error: isCurrentResult ? result.error : null,
  };
}

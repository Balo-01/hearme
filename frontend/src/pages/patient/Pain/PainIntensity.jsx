import { useLocation } from 'react-router-dom';
import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function PainIntensity() {
  const location = useLocation();
  const area = location.state?.area || 'Unknown area';
  const normalizedArea = String(area).toLowerCase();
  const { getNavigationProps } = useHoverNavigate(4000);

  return (
    <>
      <div className="center-message">Pain intensity for {normalizedArea}?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/final-answer', {
            state: {
              source: 'pain',
              request: `${area} pain - Mild`,
              path: ['pain', normalizedArea, 'mild'],
            },
          })}
        >
          Mild
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', {
            state: {
              source: 'pain',
              request: `${area} pain - Moderate`,
              path: ['pain', normalizedArea, 'moderate'],
            },
          })}
        >
          Moderate
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', {
            state: {
              source: 'pain',
              request: `${area} pain - Severe`,
              path: ['pain', normalizedArea, 'severe'],
            },
          })}
        >
          Severe
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/final-answer', {
            state: {
              source: 'pain',
              request: `${area} pain - Unbearable`,
              path: ['pain', normalizedArea, 'unbearable'],
            },
          })}
        >
          Unbearable
        </button>
      </div>
    </>
  );
}

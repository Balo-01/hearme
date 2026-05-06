import { useLocation } from 'react-router-dom';
import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function PainIntensity() {
  const location = useLocation();
  const area = location.state?.area || 'Unknown area';
  const normalizedArea = String(area).toLowerCase();
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Pain intensity for {normalizedArea}?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() =>
            handleMouseEnter('/patient/final-answer', {
              state: {
                source: 'pain',
                request: `${area} pain - Mild`,
              },
            })
          }
          onMouseLeave={handleMouseLeave}
        >
          Mild
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() =>
            handleMouseEnter('/patient/final-answer', {
              state: {
                source: 'pain',
                request: `${area} pain - Moderate`,
              },
            })
          }
          onMouseLeave={handleMouseLeave}
        >
          Moderate
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() =>
            handleMouseEnter('/patient/final-answer', {
              state: {
                source: 'pain',
                request: `${area} pain - Severe`,
              },
            })
          }
          onMouseLeave={handleMouseLeave}
        >
          Severe
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() =>
            handleMouseEnter('/patient/final-answer', {
              state: {
                source: 'pain',
                request: `${area} pain - Unbearable`,
              },
            })
          }
          onMouseLeave={handleMouseLeave}
        >
          Unbearable
        </button>
      </div>
    </>
  );
}

import '../../../App.css';
import useCategoryRecommendations from '../../../hooks/useCategoryRecommendations';
import useHoverNavigate from '../../../hooks/useHoverNavigate';
import { toPainOption } from '../../../utils/recommendationOptions';

const PAIN_FALLBACKS = ['head pain', 'stomach pain', 'back pain'];
const RECOMMENDATION_POSITIONS = ['top-left', 'top-right', 'bottom-left'];

export default function Pain() {
  const { getNavigationProps } = useHoverNavigate(3000);
  const { recommendations, isLoading } = useCategoryRecommendations('pain', PAIN_FALLBACKS);
  const options = recommendations.map(toPainOption);

  return (
    <>
      <div className="center-message">
        {isLoading ? 'Preparing options...' : 'What hurts?'}
      </div>
      <div className="quadrant-container">
        {options.map((option, index) => (
          <button
            key={option.state.area}
            className={`quadrant-btn ${RECOMMENDATION_POSITIONS[index]}`}
            disabled={isLoading}
            {...(isLoading ? {} : getNavigationProps(option.to, { state: option.state }))}
          >
            {option.label}
          </button>
        ))}
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/pain/other')}
        >
          Other
        </button>
      </div>
    </>
  );
}

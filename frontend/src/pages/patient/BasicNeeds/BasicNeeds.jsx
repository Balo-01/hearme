import '../../../App.css';
import useCategoryRecommendations from '../../../hooks/useCategoryRecommendations';
import useHoverNavigate from '../../../hooks/useHoverNavigate';
import { toBasicNeedOption } from '../../../utils/recommendationOptions';

const BASIC_NEEDS_FALLBACKS = ['water', 'food', 'toilet'];
const RECOMMENDATION_POSITIONS = ['top-left', 'top-right', 'bottom-left'];

export default function BasicNeeds() {
  const { getNavigationProps } = useHoverNavigate(3000);
  const { recommendations, isLoading } = useCategoryRecommendations(
    'basic_needs',
    BASIC_NEEDS_FALLBACKS,
  );
  const options = recommendations.map(toBasicNeedOption);

  return (
    <>
      <div className="center-message">
        {isLoading ? 'Preparing options...' : 'What can I do for you?'}
      </div>
      <div className="quadrant-container">
        {options.map((option, index) => (
          <button
            key={option.state.path.join(':')}
            className={`quadrant-btn ${RECOMMENDATION_POSITIONS[index]}`}
            disabled={isLoading}
            {...(isLoading ? {} : getNavigationProps(option.to, { state: option.state }))}
          >
            {option.label}
          </button>
        ))}
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/basic-needs/other')}
        >
          Other
        </button>
      </div>
    </>
  );
}

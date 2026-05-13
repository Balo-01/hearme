import '../../../App.css';
import useCategoryRecommendations from '../../../hooks/useCategoryRecommendations';
import useHoverNavigate from '../../../hooks/useHoverNavigate';
import { toCommunicationOption } from '../../../utils/recommendationOptions';

const COMMUNICATION_FALLBACKS = ['call nurse', 'call family', 'call doctor'];
const RECOMMENDATION_POSITIONS = ['top-left', 'top-right', 'bottom-left'];

export default function Communication() {
  const { getNavigationProps } = useHoverNavigate(4000);
  const { recommendations, isLoading } = useCategoryRecommendations(
    'communication',
    COMMUNICATION_FALLBACKS,
  );
  const options = recommendations.map(toCommunicationOption);

  return (
    <>
      <div className="center-message">
        {isLoading ? 'Preparing options...' : 'Who do you want to talk to?'}
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
          disabled={isLoading}
          {...(isLoading ? {} : getNavigationProps('/patient/communication/other'))}
        >
          Other
        </button>
      </div>
    </>
  );
}

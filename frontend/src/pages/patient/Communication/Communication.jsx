import '../../../App.css';
import useCategoryRecommendations from '../../../hooks/useCategoryRecommendations';
import useHoverNavigate from '../../../hooks/useHoverNavigate';
import {
  firstUnusedRecommendation,
  toCommunicationOption,
} from '../../../utils/recommendationOptions';

const COMMUNICATION_OPTIONS = ['call nurse', 'call family', 'call doctor', 'call cleaning'];
const COMMUNICATION_FALLBACKS = COMMUNICATION_OPTIONS.slice(0, 3);
const BUTTON_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export default function Communication() {
  const { getNavigationProps } = useHoverNavigate(3000);
  const { recommendations, isLoading } = useCategoryRecommendations(
    'communication',
    COMMUNICATION_FALLBACKS,
  );
  const finalOption = firstUnusedRecommendation(COMMUNICATION_OPTIONS, recommendations) || COMMUNICATION_OPTIONS[3];
  const options = [...recommendations, finalOption].slice(0, 4).map(toCommunicationOption);

  return (
    <>
      <div className="center-message">
        {isLoading ? 'Preparing options...' : 'Who do you want to talk to?'}
      </div>
      <div className="quadrant-container">
        {options.map((option, index) => (
          <button
            key={option.state.path.join(':')}
            className={`quadrant-btn ${BUTTON_POSITIONS[index]}`}
            disabled={isLoading}
            {...(isLoading ? {} : getNavigationProps(option.to, { state: option.state }))}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

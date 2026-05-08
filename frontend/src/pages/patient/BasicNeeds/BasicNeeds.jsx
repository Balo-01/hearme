import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function BasicNeeds() {
  const { getNavigationProps } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">What can I do for you?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Water', path: ['basic-needs', 'water'] } })}
        >
          Water
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Food', path: ['basic-needs', 'food'] } })}
        >
          Food
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Toilet', path: ['basic-needs', 'toilet'] } })}
        >
          Toilet
        </button>
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

import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function BasicNeedsOther() {
  const { getNavigationProps } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Other basic needs</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Temperature' } })}
        >
          Temperature
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Blanket' } })}
        >
          Blanket
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Lighting' } })}
        >
          Lighting
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Assistance' } })}
        >
          Assistance
        </button>
      </div>
    </>
  );
}

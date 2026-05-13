import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function BasicNeedsOther() {
  const { getNavigationProps } = useHoverNavigate(4000);

  return (
    <>
      <div className="center-message">Other basic needs</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Temperature', path: ['basic_needs', 'temperature'] } })}
        >
          Temperature
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Blanket', path: ['basic_needs', 'blanket'] } })}
        >
          Blanket
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Lighting', path: ['basic_needs', 'lighting'] } })}
        >
          Lighting
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'basic-needs', request: 'Body position', path: ['basic_needs', 'body position'] } })}
        >
          Body position
        </button>
      </div>
    </>
  );
}

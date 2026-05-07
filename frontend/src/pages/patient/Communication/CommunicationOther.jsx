import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function CommunicationOther() {
  const { getNavigationProps } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Other communication options</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Doctor' } })}
        >
          Doctor
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Family' } })}
        >
          Family
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Translator' } })}
        >
          Translator
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Call support' } })}
        >
          Call support
        </button>
      </div>
    </>
  );
}

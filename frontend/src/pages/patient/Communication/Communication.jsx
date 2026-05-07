import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function Communication() {
  const { getNavigationProps } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Who do you want to talk to?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Nurse' } })}
        >
          Nurse
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Wife' } })}
        >
          Wife
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Friend' } })}
        >
          Friend
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/communication/other')}
        >
          Other
        </button>
      </div>
    </>
  );
}

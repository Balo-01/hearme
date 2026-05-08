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
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Nurse', path: ['communication', 'nurse'] } })}
        >
          Nurse
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Family', path: ['communication', 'family'] } })}
        >
          Family
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Doctor', path: ['communication', 'doctor'] } })}
        >
          Doctor
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/final-answer', { state: { source: 'communication', request: 'Cleaning', path: ['communication', 'cleaning'] } })}
        >
          Cleaning
        </button>
      </div>
    </>
  );
}

import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function Pain() {
  const { getNavigationProps } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">What hurts?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Head' } })}
        >
          Head
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Stomach' } })}
        >
          Stomach
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Back' } })}
        >
          Back
        </button>
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

import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function Home() {
  // Home entry screen: 4 quadrants, each navigates after sustained hover.
  const { getNavigationProps } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">What is your need?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          aria-label="Basic Needs"
          {...getNavigationProps('/patient/basic-needs')}
        >
          <span className="icon" role="img" aria-label="Basic Needs">🍽️</span>
          <span className="btn-label">Basic Needs</span>
        </button>
        <button
          className="quadrant-btn top-right"
          aria-label="Communication"
          {...getNavigationProps('/patient/communication')}
        >
          <span className="icon" role="img" aria-label="Communication">💬</span>
          <span className="btn-label">Communication</span>
        </button>
        <button
          className="quadrant-btn bottom-left"
          aria-label="Pain"
          {...getNavigationProps('/patient/pain')}
        >
          <span className="icon" role="img" aria-label="Pain">🤕</span>
          <span className="btn-label">Pain</span>
        </button>
        <button
          className="quadrant-btn bottom-right"
          aria-label="Emergency"
          {...getNavigationProps('/patient/emergency')}
        >
          <span className="icon" role="img" aria-label="Emergency">🚨</span>
          <span className="btn-label">Emergency</span>
        </button>
      </div>
    </>
  );
}

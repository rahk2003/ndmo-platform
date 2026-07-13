function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-stack" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <span />
          <strong />
          <em />
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;

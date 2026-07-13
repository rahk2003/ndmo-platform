function getScoreTone(score) {
  if (score >= 85) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

function ScoreProgress({ score, label }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = getScoreTone(value);

  return (
    <div className="score-progress">
      <div className="score-progress-header">
        {label && <span>{label}</span>}
        <strong>{value}%</strong>
      </div>
      <div className="score-track" aria-hidden="true">
        <div className={`score-fill score-${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default ScoreProgress;

function KpiCard({ icon: Icon, label, value, detail, tone = "blue", trend }) {
  return (
    <article className={`kpi-card kpi-${tone}`}>
      <div className="kpi-topline">
        <div className="kpi-icon">{Icon && <Icon size={20} />}</div>
        {trend && <span className="kpi-trend">{trend}</span>}
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </article>
  );
}

export default KpiCard;

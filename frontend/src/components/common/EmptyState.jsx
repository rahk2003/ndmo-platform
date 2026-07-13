function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <section className="empty-state">
      {Icon && <div className="empty-state-icon"><Icon size={28} /></div>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

export default EmptyState;

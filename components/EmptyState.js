export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-soft" aria-hidden="true" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

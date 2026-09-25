const STYLES = {
  ADMIN: "bg-mark text-on-mark border-transparent",
  USER: "border-line text-soft",
  VISITOR: "border-dashed border-line text-soft",
};
const LABELS = { ADMIN: "Admin", USER: "User", VISITOR: "Visitor" };

export default function RoleBadge({ role = "VISITOR", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-px text-[11px] font-medium ${STYLES[role] || STYLES.USER} ${className}`}>
      {LABELS[role] || role}
    </span>
  );
}

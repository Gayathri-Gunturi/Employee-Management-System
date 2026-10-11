const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "employees", label: "Employees" },
];

export default function Sidebar({ current, onNavigate, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">EMS</div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={"nav-link" + (current === item.key ? " active" : "")}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-user">{user.full_name}</span>
        <button className="nav-link logout-link" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}

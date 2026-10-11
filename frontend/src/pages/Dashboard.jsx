import { useEffect, useState } from "react";
import { getDashboard } from "../api.js";
import StatCard from "../components/StatCard.jsx";
import Message from "../components/Message.jsx";
import { formatCurrency } from "../utils.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    getDashboard()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <Message type="error" text={error} />;

  const maxCount = Math.max(...data.by_department.map((d) => d.count), 1);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatCard label="Total Employees" value={data.total_employees} />
        <StatCard label="Total Departments" value={data.total_departments} />
        <StatCard label="Average Salary" value={formatCurrency(data.average_salary)} />
      </div>

      <div className="card">
        <h2>Employees by Department</h2>
        {data.by_department.length === 0 ? (
          <p className="muted">No employees yet. Add some from the Employees page.</p>
        ) : (
          <div className="bar-chart">
            {data.by_department.map((d) => (
              <div className="bar-row" key={d.department}>
                <span className="bar-label">{d.department}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
                <span className="bar-count">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

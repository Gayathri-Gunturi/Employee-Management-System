import { formatCurrency, formatDate } from "../utils.js";

export default function EmployeeTable({ employees, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Job Title</th>
            <th>Salary</th>
            <th>Joining Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.full_name}</td>
              <td>{emp.email}</td>
              <td>{emp.department}</td>
              <td>{emp.job_title}</td>
              <td>{formatCurrency(emp.salary)}</td>
              <td>{formatDate(emp.joining_date)}</td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => onEdit(emp)}>
                  Edit
                </button>
                <button className="btn btn-small btn-danger-outline" onClick={() => onDelete(emp)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

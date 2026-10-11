import { useEffect, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../api.js";
import { DEPARTMENTS } from "../constants.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmployeeForm from "../components/EmployeeForm.jsx";
import EmployeeTable from "../components/EmployeeTable.jsx";
import Message from "../components/Message.jsx";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // Load employees whenever the search, filter or refresh counter changes.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(() => {
      getEmployees(search.trim(), department)
        .then((data) => {
          if (ignore) return;
          setEmployees(data);
          setError("");
        })
        .catch((err) => {
          if (!ignore) setError(err.message);
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, department, refreshCount]);

  // Hide success/error notices after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function refresh() {
    setRefreshCount((n) => n + 1);
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(employee) {
    setEditing(employee);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  // Errors are thrown back to EmployeeForm, which displays them.
  async function handleSave(values) {
    if (editing) {
      await updateEmployee(editing.id, values);
      setNotice({ type: "success", text: "Employee updated successfully." });
    } else {
      await createEmployee(values);
      setNotice({ type: "success", text: "Employee added successfully." });
    }
    closeForm();
    refresh();
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteEmployee(deleting.id);
      setNotice({ type: "success", text: "Employee deleted successfully." });
      refresh();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  const filtersActive = search.trim() !== "" || department !== "";

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Employee
        </button>
      </div>

      {notice && <Message type={notice.type} text={notice.text} />}

      <div className="card">
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {error && <Message type="error" text={error} />}

        {loading ? (
          <div className="loading">Loading employees...</div>
        ) : employees.length === 0 && !error ? (
          <div className="empty-state">
            {filtersActive
              ? "No employees match your search or filter. Try different keywords."
              : "No employees yet. Click \"Add Employee\" to create the first one."}
          </div>
        ) : (
          <EmployeeTable employees={employees} onEdit={openEdit} onDelete={setDeleting} />
        )}
      </div>

      {formOpen && <EmployeeForm employee={editing} onSubmit={handleSave} onCancel={closeForm} />}

      {deleting && (
        <ConfirmDialog
          title="Delete employee?"
          message={`Are you sure you want to delete ${deleting.full_name}? This cannot be undone.`}
          confirmLabel="Delete"
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

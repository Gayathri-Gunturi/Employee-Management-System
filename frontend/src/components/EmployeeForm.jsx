import { useState } from "react";
import { DEPARTMENTS } from "../constants.js";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validate(values) {
  const errors = {};
  if (!values.full_name.trim()) errors.full_name = "Full name is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (!values.department) errors.department = "Department is required.";
  if (!values.job_title.trim()) errors.job_title = "Job title is required.";
  if (values.salary === "") errors.salary = "Salary is required.";
  else if (Number.isNaN(Number(values.salary))) errors.salary = "Salary must be a number.";
  else if (Number(values.salary) < 0) errors.salary = "Salary cannot be negative.";
  if (!values.joining_date) errors.joining_date = "Joining date is required.";
  return errors;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }) {
  const isEdit = Boolean(employee);
  const [values, setValues] = useState({
    full_name: employee ? employee.full_name : "",
    email: employee ? employee.email : "",
    department: employee ? employee.department : "",
    job_title: employee ? employee.job_title : "",
    salary: employee ? String(employee.salary) : "",
    joining_date: employee ? employee.joining_date : "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...values, salary: Number(values.salary) });
    } catch (err) {
      const fieldErrors = err.fieldErrors || {};
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else setErrors({ form: err.message });
      setSubmitting(false);
    }
  }

  function field(name, label, input) {
    return (
      <div className="form-group">
        <label htmlFor={name}>{label}</label>
        {input}
        {errors[name] && <span className="field-error">{errors[name]}</span>}
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEdit ? "Edit Employee" : "Add Employee"}</h2>
        <form onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="message message-error">{errors.form}</div>}

          {field(
            "full_name",
            "Full name",
            <input id="full_name" name="full_name" value={values.full_name} onChange={handleChange} />
          )}
          {field(
            "email",
            "Email",
            <input id="email" name="email" type="email" value={values.email} onChange={handleChange} />
          )}
          {field(
            "department",
            "Department",
            <select id="department" name="department" value={values.department} onChange={handleChange}>
              <option value="">Select a department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          {field(
            "job_title",
            "Job title",
            <input id="job_title" name="job_title" value={values.job_title} onChange={handleChange} />
          )}
          {field(
            "salary",
            "Salary (INR per year)",
            <input id="salary" name="salary" type="number" min="0" step="1" value={values.salary} onChange={handleChange} />
          )}
          {field(
            "joining_date",
            "Joining date",
            <input id="joining_date" name="joining_date" type="date" value={values.joining_date} onChange={handleChange} />
          )}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

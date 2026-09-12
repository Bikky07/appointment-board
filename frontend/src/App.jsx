import { useEffect, useState } from "react"
import "./App.css"

function App() {
  const [appointments, setAppointments] = useState([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [filterDate, setFilterDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const [form, setForm] = useState({
    title: "",
    description: "",
    appointment_date: "",
    start_time: "",
    end_time: ""
  })

  function formatTimeForInput(time) {
    if (!time) return ""

    if (typeof time === "string" && time.includes(":")) {
      return time.slice(0, 5)
    }

    const totalSeconds = Number(time)

    if (Number.isNaN(totalSeconds)) {
      return ""
    }

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`
  }

  function loadAppointments() {
    fetch("http://127.0.0.1:8000/appointments")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load appointments")
        }

        return response.json()
      })
      .then((data) => {
        setAppointments(data)
      })
      .catch(() => {
        setError("Could not load appointments")
      })
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }))
  }

  function clearForm() {
    setForm({
      title: "",
      description: "",
      appointment_date: "",
      start_time: "",
      end_time: ""
    })

    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage("")
    setError("")

    if (
      !form.title ||
      !form.appointment_date ||
      !form.start_time ||
      !form.end_time
    ) {
      setError("Please fill all required fields")
      return
    }

    if (form.end_time <= form.start_time) {
      setError("End time must be after start time")
      return
    }

    const url = editingId
      ? `http://127.0.0.1:8000/appointments/${editingId}`
      : "http://127.0.0.1:8000/appointments"

    const method = editingId ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          setError(
            data.detail
              .map((item) => item.msg)
              .join(", ")
          )
        } else {
          setError(data.detail || "Action failed")
        }

        return
      }

      setMessage(
        editingId
          ? "Appointment updated successfully"
          : "Appointment added successfully"
      )

      clearForm()
      loadAppointments()
    } catch (error) {
      setError("Backend is not connected")
    }
  }

  function startEditing(appointment) {
    setEditingId(appointment.id)

    setForm({
      title: appointment.title,
      description: appointment.description || "",
      appointment_date: appointment.appointment_date,
      start_time: formatTimeForInput(appointment.start_time),
      end_time: formatTimeForInput(appointment.end_time)
    })

    setMessage("")
    setError("")

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  async function updateAppointmentStatus(id, action) {
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/appointments/${id}/${action}`,
        {
          method: "PATCH"
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Action failed")
        return
      }

      setMessage(data.message)
      loadAppointments()
    } catch (error) {
      setError("Backend is not connected")
    }
  }

  async function handleDelete(appointmentId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    )

    if (!confirmDelete) {
      return
    }

    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/appointments/${appointmentId}`,
        {
          method: "DELETE"
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Failed to delete appointment")
        return
      }

      setAppointments((previousAppointments) =>
        previousAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        )
      )

      setMessage("Appointment deleted successfully")
    } catch (error) {
      setError("Unable to delete appointment")
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesDate =
      filterDate === "" ||
      appointment.appointment_date === filterDate

    const matchesStatus =
      filterStatus === "all" ||
      appointment.status === filterStatus

    return matchesDate && matchesStatus
  })

  return (
    <div className="container">
      <header className="page-header">
        <div className="header-icon">📅</div>

        <h1>Appointment Board</h1>

        <p className="page-subtitle">
          Manage your appointments easily and efficiently
        </p>
      </header>

      <form className="form-section" onSubmit={handleSubmit}>
        <h2>
          {editingId ? "✏️ Edit Appointment" : "➕ Add Appointment"}
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Appointment Title *</label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="Example: Client Meeting"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="appointment_date">Date *</label>

            <input
              id="appointment_date"
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description</label>

            <textarea
              id="description"
              name="description"
              placeholder="Write appointment details..."
              value={form.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="start_time">Start Time *</label>

            <input
              id="start_time"
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end_time">End Time *</label>

            <input
              id="end_time"
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-buttons">
          <button className="primary-button" type="submit">
            {editingId ? "Update Appointment" : "Add Appointment"}
          </button>

          {editingId && (
            <button
              className="secondary-button"
              type="button"
              onClick={clearForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {message && (
        <div className="success-message">
          ✅ {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <section className="filter-section">
        <div className="section-heading">
          <div>
            <h2>🔎 Filter Appointments</h2>
            <p>Find appointments by date or status</p>
          </div>

          <button
            className="clear-button"
            type="button"
            onClick={() => {
              setFilterDate("")
              setFilterStatus("all")
            }}
          >
            Clear Filters
          </button>
        </div>

        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="filterDate">Filter by Date</label>

            <input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="filterStatus">Filter by Status</label>

            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      <div className="appointments-heading">
        <div>
          <h2>All Appointments</h2>
          <p>Your appointment schedule</p>
        </div>

        <span className="appointment-count">
          {filteredAppointments.length} Appointments
        </span>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No appointments found</h3>
          <p>Try changing your filters or add a new appointment.</p>
        </div>
      ) : (
        <div className="appointment-list">
          {filteredAppointments.map((appointment) => (
            <div
              className="appointment-card"
              key={appointment.id}
            >
              <div className="card-top">
                <div className="patient-icon">📅</div>

                <span className={`status ${appointment.status}`}>
                  {appointment.status}
                </span>
              </div>

              <h3>{appointment.title}</h3>

              <p className="appointment-description">
                {appointment.description ||
                  "No description provided."}
              </p>

              <div className="appointment-detail">
                <span>📆</span>
                <div>
                  <small>Date</small>
                  <strong>{appointment.appointment_date}</strong>
                </div>
              </div>

              <div className="appointment-detail">
                <span>⏰</span>
                <div>
                  <small>Time</small>
                  <strong>
                    {formatTimeForInput(appointment.start_time)} -{" "}
                    {formatTimeForInput(appointment.end_time)}
                  </strong>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="edit-button"
                  onClick={() => startEditing(appointment)}
                >
                  ✏️ Edit
                </button>

                <button
                  className="delete-button"
                  onClick={() => handleDelete(appointment.id)}
                >
                  🗑️ Delete
                </button>
              </div>

              {appointment.status === "scheduled" && (
                <div className="card-actions">
                  <button
                    className="complete-button"
                    onClick={() =>
                      updateAppointmentStatus(
                        appointment.id,
                        "complete"
                      )
                    }
                  >
                    ✅ Complete
                  </button>

                  <button
                    className="cancel-button"
                    onClick={() =>
                      updateAppointmentStatus(
                        appointment.id,
                        "cancel"
                      )
                    }
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AppointmentCreate(BaseModel):
    title: str
    description: str = ""
    appointment_date: str
    start_time: str
    end_time: str


@app.get("/")
def home():
    return {
        "message": "Appointment Board API is working"
    }


@app.get("/test-db")
def test_database():
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM appointments")
    result = cursor.fetchone()

    cursor.close()
    connection.close()

    return {
        "message": "MySQL connected successfully",
        "appointment_count": result[0]
    }


@app.get("/appointments")
def get_appointments():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            title,
            description,
            appointment_date,
            start_time,
            end_time,
            status
        FROM appointments
        ORDER BY appointment_date, start_time
    """)

    appointments = cursor.fetchall()

    cursor.close()
    connection.close()

    return appointments


@app.post("/appointments")
def create_appointment(appointment: AppointmentCreate):
    if not appointment.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Title is required"
        )

    if appointment.end_time <= appointment.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT id
        FROM appointments
        WHERE appointment_date = %s
        AND status != 'cancelled'
        AND %s < end_time
        AND %s > start_time
    """, (
        appointment.appointment_date,
        appointment.start_time,
        appointment.end_time
    ))

    overlapping_appointment = cursor.fetchone()

    if overlapping_appointment:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="This time slot is already booked"
        )

    cursor.execute("""
        INSERT INTO appointments
        (
            title,
            description,
            appointment_date,
            start_time,
            end_time,
            status
        )
        VALUES (%s, %s, %s, %s, %s, 'scheduled')
    """, (
        appointment.title,
        appointment.description,
        appointment.appointment_date,
        appointment.start_time,
        appointment.end_time
    ))

    connection.commit()

    new_appointment_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return {
        "message": "Appointment created successfully",
        "appointment_id": new_appointment_id
    }
@app.patch("/appointments/{appointment_id}/complete")
def complete_appointment(appointment_id: int):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE appointments
        SET status = 'completed'
        WHERE id = %s
    """, (appointment_id,))

    connection.commit()

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    cursor.close()
    connection.close()

    return {
        "message": "Appointment marked as completed"
    }


@app.patch("/appointments/{appointment_id}/cancel")
def cancel_appointment(appointment_id: int):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE appointments
        SET status = 'cancelled'
        WHERE id = %s
    """, (appointment_id,))

    connection.commit()

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    cursor.close()
    connection.close()

    return {
        "message": "Appointment cancelled successfully"
    }
@app.put("/appointments/{appointment_id}")
def update_appointment(
    appointment_id: int,
    appointment: AppointmentCreate
):
    if not appointment.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Title is required"
        )

    if appointment.end_time <= appointment.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    connection = get_db_connection()
    cursor = connection.cursor()

    # Check whether the appointment exists
    cursor.execute("""
        SELECT id
        FROM appointments
        WHERE id = %s
    """, (appointment_id,))

    existing_appointment = cursor.fetchone()

    if not existing_appointment:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    # Check overlapping time slots
    cursor.execute("""
        SELECT id
        FROM appointments
        WHERE appointment_date = %s
        AND status != 'cancelled'
        AND id != %s
        AND %s < end_time
        AND %s > start_time
    """, (
        appointment.appointment_date,
        appointment_id,
        appointment.start_time,
        appointment.end_time
    ))

    overlapping_appointment = cursor.fetchone()

    if overlapping_appointment:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="This time slot is already booked"
        )

    cursor.execute("""
        UPDATE appointments
        SET
            title = %s,
            description = %s,
            appointment_date = %s,
            start_time = %s,
            end_time = %s
        WHERE id = %s
    """, (
        appointment.title,
        appointment.description,
        appointment.appointment_date,
        appointment.start_time,
        appointment.end_time,
        appointment_id
    ))

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Appointment updated successfully"
    }
@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM appointments WHERE id = %s",
        (appointment_id,)
    )

    connection.commit()

    if cursor.rowcount == 0:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    cursor.close()
    connection.close()

    return {
        "message": "Appointment deleted successfully"
    }
# Appointment Board

Appointment Board is a full-stack web application for managing appointments.

Users can create, view, update, complete, cancel, and delete appointments. The application also provides date and status filters to help users manage appointments easily.

## Features

- View all appointments
- Add a new appointment
- Edit appointment details
- Mark appointments as completed
- Cancel appointments
- Delete appointments
- Filter appointments by date
- Filter appointments by status
- Display success and error messages
- Store appointment data in MySQL
- REST API using FastAPI

## Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

### Database

- MySQL
- MySQL Connector/Python

## Project Structure

```text
appointment-board/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── README.md
└── .gitignore
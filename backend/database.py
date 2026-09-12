import mysql.connector


def get_db_connection():
    connection = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="Bikky@123",
        database="appointment_board"
    )

    return connection
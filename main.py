import uvicorn
from fastapi import FastAPI, Path
from pydantic import BaseModel

app = FastAPI()

students = {
    1: {
        "name": "bob",
        "age": 17,
        "year": "first year"
    }
}

class Student(BaseModel):
    name: str
    age: int
    year: str

@app.get("/")
def root():
    return {"sdfsff": "testing"}

@app.get("/get-student/{student_id}")
def get_student(student_id: int):
    return students[student_id]

@app.get("/get-by-name/{student_id}")
def get_student(name: str):
    for student_id in students:
        if students[student_id]["name"] == name:
            return students[student_id]
    return {"Data": "Not found"}

@app.post("/create-student/{student_id}")
def create_student(student_id : int, student: Student):
    if student_id in students:
        return {"Error": "Student exists"}
    
    students[student_id] = student
    return students[student_id]

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
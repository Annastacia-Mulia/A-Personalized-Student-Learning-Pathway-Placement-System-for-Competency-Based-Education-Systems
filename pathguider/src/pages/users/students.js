import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, updateDoc, query, where, doc as fsDoc } from "firebase/firestore";
import Table from "../../components/Table";

const Students = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsQ = query(collection(db, "users"), where("role", "==", "student"));
      const studentsSnap = await getDocs(studentsQ);
      setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudents();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    await deleteDoc(fsDoc(db, "users", id));
    setStudents((students) => students.filter((u) => u.id !== id));
  }

  async function handleUpdate(id, user) {
    const newFirst = window.prompt("Edit first name", user.firstName || "");
    const newLast = window.prompt("Edit last name", user.lastName || "");
    if (newFirst && newLast) {
      await updateDoc(fsDoc(db, "users", id), {
        firstName: newFirst,
        lastName: newLast,
      });
      setStudents((students) =>
        students.map((u) =>
          u.id === id ? { ...u, firstName: newFirst, lastName: newLast } : u
        )
      );
    }
  }

  return (
    <div className="table-container">
      <h2 className="table-heading">All Students</h2>
      <Table
        data={students}
        columns={["First Name", "Last Name", "Email", "Actions"]}
        keys={["firstName", "lastName", "email", "actions"]}
        emptyMsg="No students found."
        renderActions={(row) => (
          <>
            <button style={{ marginRight: 8 }} onClick={() => handleUpdate(row.id, row)}>
              Update
            </button>
            <button style={{ color: "red" }} onClick={() => handleDelete(row.id)}>
              Delete
            </button>
          </>
        )}
      />
    </div>
  );
};

export default Students;

import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, updateDoc, query, where, doc as fsDoc } from "firebase/firestore";
import Table from "../../components/Table";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const teachersQ = query(collection(db, "users"), where("role", "==", "teacher"));
      const teachersSnap = await getDocs(teachersQ);
      setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchTeachers();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    await deleteDoc(fsDoc(db, "users", id));
    setTeachers((teachers) => teachers.filter((u) => u.id !== id));
  }

  async function handleUpdate(id, user) {
    const newFirst = window.prompt("Edit first name", user.firstName || "");
    const newLast = window.prompt("Edit last name", user.lastName || "");
    if (newFirst && newLast) {
      await updateDoc(fsDoc(db, "users", id), {
        firstName: newFirst,
        lastName: newLast,
      });
      setTeachers((teachers) =>
        teachers.map((u) =>
          u.id === id ? { ...u, firstName: newFirst, lastName: newLast } : u
        )
      );
    }
  }

  return (
    <div className="table-container">
      <h2 className="table-heading">All Teachers</h2>
      <Table
        data={teachers}
        columns={["First Name", "Last Name", "Email", "Actions"]}
        keys={["firstName", "lastName", "email", "actions"]}
        emptyMsg="No teachers found."
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

export default Teachers;

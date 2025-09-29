import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, updateDoc, doc as fsDoc } from "firebase/firestore";
import Table from "../../components/Table";

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await deleteDoc(fsDoc(db, "users", id));
    setUsers((users) => users.filter((u) => u.id !== id));
  }

  async function handleUpdate(id, user) {
    const newFirst = window.prompt("Edit first name", user.firstName || "");
    const newLast = window.prompt("Edit last name", user.lastName || "");
    if (newFirst && newLast) {
      await updateDoc(fsDoc(db, "users", id), {
        firstName: newFirst,
        lastName: newLast,
      });
      setUsers((users) =>
        users.map((u) =>
          u.id === id ? { ...u, firstName: newFirst, lastName: newLast } : u
        )
      );
    }
  }

  return (
    <div className="table-container">
      <h2 className="table-heading">All Users</h2>
      <Table
        data={users}
        columns={["First Name", "Last Name", "Email", "Role", "Actions"]}
        keys={["firstName", "lastName", "email", "role", "actions"]}
        emptyMsg="No users found."
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

export default Users;

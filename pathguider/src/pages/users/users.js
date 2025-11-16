import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, updateDoc, doc as fsDoc } from "firebase/firestore";
import Table from "../../components/Table";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [sortRole, setSortRole] = useState("");

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

  // Filter and sort logic
  let filtered = users;
  if (roleFilter) {
    filtered = filtered.filter(u => u.role === roleFilter);
  }
  if (sortRole) {
    filtered = [...filtered].sort((a, b) => {
      if (a.role === b.role) return 0;
      return a.role > b.role ? 1 : -1;
    });
  }

  return (
    <div className="table-container">
      <h2 className="table-heading">All Users</h2>
      <div style={{display:'flex',gap:16,marginBottom:18,alignItems:'center',width:'fit-content'}}>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{padding:'8px',fontSize:16,borderRadius:6,border:'1px solid #ccc',width:160}}
        >
          <option value="">Show all roles</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <button
          style={{padding:'6px 12px',fontSize:14,borderRadius:6,border:'1px solid #603bbb',background:sortRole ? '#603bbb' : '#eee', color:sortRole ? '#fff' : '#603bbb', width:160, minWidth:0}}
          onClick={() => setSortRole(sortRole ? "" : "role")}
        >
          {sortRole ? "Clear Sort" : "Sort by Role"}
        </button>
      </div>
      <Table
        data={filtered}
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

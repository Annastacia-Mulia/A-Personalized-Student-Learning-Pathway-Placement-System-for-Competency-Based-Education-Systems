import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "../../supabase";
import Table from "../../components/Table";

const Students = forwardRef((props, ref) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // Expose fetchStudents for parent to trigger refresh after upload
  const fetchStudents = async () => {
    try {
      // Get students from 'users' table
      const { data: userStudents, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      // Get students from 'student_pathways' table
      const { data: pathwayStudents, error: pathwaysError } = await supabase
        .from('student_pathways')
        .select('*');

      if (pathwaysError) {
        console.error('Error fetching pathways:', pathwaysError);
        return;
      }

      // Add missing pathway students to users table
      const userEmails = new Set(userStudents.map(s => s.email));
      const missingStudents = pathwayStudents.filter(s => !userEmails.has(s.email));
      
      for (const s of missingStudents) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            role: 'student'
          });

        if (insertError) {
          console.error('Error inserting missing student:', insertError);
        }
      }

      // Re-fetch users after adding missing students
      const { data: updatedStudents, error: refetchError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student');

      if (refetchError) {
        console.error('Error refetching users:', refetchError);
        return;
      }

      setStudents(updatedStudents || []);
    } catch (error) {
      console.error('Error in fetchStudents:', error);
    }
  };
  React.useEffect(() => {
    fetchStudents();
  }, []);
  useImperativeHandle(ref, () => ({ fetchStudents }));

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting student:', error);
      return;
    }
    
    setStudents((students) => students.filter((u) => u.id !== id));
  }

  async function handleUpdate(id, user) {
    const newFirst = window.prompt("Edit first name", user.first_name || "");
    const newLast = window.prompt("Edit last name", user.last_name || "");
    if (newFirst && newLast) {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: newFirst,
          last_name: newLast,
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating student:', error);
        return;
      }
      
      setStudents((students) =>
        students.map((u) =>
          u.id === id ? { ...u, first_name: newFirst, last_name: newLast } : u
        )
      );
    }
  }

  // Filter logic
  let filtered = students.filter(s => {
    const term = search.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(term) ||
      s.last_name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="table-container">
      <h2 className="table-heading">All Students</h2>
      <div style={{display:'flex',gap:16,marginBottom:18}}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{padding:'8px',fontSize:16,borderRadius:6,border:'1px solid #ccc',width:220}}
        />
      </div>
      <Table
        data={filtered}
        columns={["First Name", "Last Name", "Email", "Actions"]}
        keys={["first_name", "last_name", "email", "actions"]}
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
});

export default Students;

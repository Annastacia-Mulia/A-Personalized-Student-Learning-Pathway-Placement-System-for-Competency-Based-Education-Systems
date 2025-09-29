import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Table from "../../components/Table";

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsQ = query(collection(db, "users"), where("role", "==", "student"));
      const studentsSnap = await getDocs(studentsQ);
      setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudents();
  }, []);

  return (
    <div className="table-container">
      <h2 className="table-heading">All Students</h2>
      <Table
        data={students}
        columns={["First Name", "Last Name", "Email"]}
        keys={["firstName", "lastName", "email"]}
        emptyMsg="No students found."
      />
    </div>
  );
};

export default TeacherStudents;

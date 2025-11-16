import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const PlacementsList = ({ isAdmin, onEdit, onDelete }) => {
  const [placements, setPlacements] = useState([]);
  const [sortPathway, setSortPathway] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlacements = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/placements");
        const data = await res.json();
        setPlacements(data.placements || []);
      } catch (err) {
        setError("Failed to fetch placements.");
      }
      setLoading(false);
    };
    fetchPlacements();
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const handleEdit = (placement) => {
    setEditTarget(placement);
    setEditValue(placement.pathway);
    setShowEditModal(true);
  };

  const handleDelete = (placementId) => {
    setDeleteTarget(placementId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`http://localhost:5000/placements/${deleteTarget}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlacements((prev) => prev.filter((p) => p.id !== deleteTarget));
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        alert("Failed to delete placement.");
      }
    } catch {
      alert("Error deleting placement.");
    }
    if (onDelete) onDelete(deleteTarget);
  };

  const confirmEdit = async () => {
    if (!editTarget || !editValue) return;
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/placements/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway: editValue }),
      });
      if (res.ok) {
        setPlacements((prev) => prev.map((p) => p.id === editTarget.id ? { ...p, pathway: editValue } : p));
        setShowEditModal(false);
        setEditTarget(null);
      } else {
        alert("Failed to update placement.");
      }
    } catch {
      alert("Error updating placement.");
    }
    setEditLoading(false);
    if (onEdit) onEdit(editTarget);
  };

  // Filter and search logic for placements
  let filteredPlacements = placements;
  if (sortPathway) {
    filteredPlacements = filteredPlacements.filter(
      p => (p.pathway || "").toLowerCase().trim() === sortPathway.toLowerCase().trim()
    );
  }
  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    filteredPlacements = filteredPlacements.filter(
      p =>
        (p.first_name && p.first_name.toLowerCase().includes(term)) ||
        (p.last_name && p.last_name.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term))
    );
  }

  if (loading) return <div>Loading placements...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (placements.length === 0) return <div>No placements found.</div>;

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: "#603bbb" }}>All Placements</h3>
      <div style={{display:'flex',gap:16,marginBottom:18}}>
        <select
          value={sortPathway}
          onChange={e => setSortPathway(e.target.value)}
          style={{padding:'8px',fontSize:16,borderRadius:6,border:'1px solid #ccc'}}
        >
          <option value="">Filter by pathway</option>
          <option value="stem">STEM</option>
          <option value="social_sciences">Social Sciences</option>
          <option value="arts">Arts</option>
        </select>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name or email"
          style={{padding:'8px',fontSize:16,borderRadius:6,border:'1px solid #ccc',flex:1}}
        />
      </div>
      <table style={{ width: "100%", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderCollapse: "collapse", border: "1px solid #e0e0e0" }}>
        <thead>
          <tr style={{ background: "#603bbb", color: "#fff" }}>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>First Name</th>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>Last Name</th>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>Email</th>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>Pathway</th>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>STEM</th>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>Social Sciences</th>
            <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>Arts & Sports</th>
            {isAdmin && <th style={{ padding: "10px", border: "1px solid #e0e0e0" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredPlacements.map((p) => (
            <tr key={p.id}>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.first_name}</td>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.last_name}</td>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.email}</td>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.pathway}</td>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.stem}</td>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.social_sciences}</td>
              <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>{p.arts}</td>
              {isAdmin && (
                <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>
                  <button onClick={() => handleEdit(p)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ color: "red" }}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} title="Delete Placement" onClose={() => setShowDeleteModal(false)}>
        <div style={{marginBottom:24}}>Are you sure you want to delete this placement?</div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
          <button onClick={() => setShowDeleteModal(false)} style={{padding:'8px 18px'}}>Cancel</button>
          <button onClick={confirmDelete} style={{padding:'8px 18px',background:'#d32f2f',color:'#fff',border:'none',borderRadius:4}}>Delete</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} title="Edit Pathway" onClose={() => setShowEditModal(false)}>
        <div style={{marginBottom:16}}>Edit pathway for <b>{editTarget?.first_name} {editTarget?.last_name}</b>:</div>
        <select
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          style={{width:'100%',padding:'8px',marginBottom:18,border:'1px solid #ccc',borderRadius:4}}
          disabled={editLoading}
        >
          <option value="stem">STEM</option>
          <option value="social_sciences">Social Sciences</option>
          <option value="arts">Arts</option>
        </select>
        <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
          <button onClick={() => setShowEditModal(false)} style={{padding:'8px 18px'}}>Cancel</button>
          <button onClick={confirmEdit} style={{padding:'8px 18px',background:'#603bbb',color:'#fff',border:'none',borderRadius:4}} disabled={editLoading}>Save</button>
        </div>
      </Modal>
    </div>
  );
};

export default PlacementsList;

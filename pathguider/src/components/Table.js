import React from "react";
import "../App.css";

function Table({ data, columns, keys, emptyMsg, renderActions }) {
  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">{emptyMsg}</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className={i % 2 === 0 ? "even-row" : "odd-row"}>
                {keys.map((k) =>
                  k === "actions" ? (
                    <td key={k} className="table-actions">{renderActions ? renderActions(row) : null}</td>
                  ) : (
                    <td key={k}>{row[k] || ""}</td>
                  )
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

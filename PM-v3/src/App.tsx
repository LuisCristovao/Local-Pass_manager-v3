import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./App.css";
import ManagePasswords from "./assets/components/ManagePasswords";

function App() {
  const navigate = useNavigate();
  return (
    <>
      <ul className="menu-list">
        <li
          
          onClick={() => {
            navigate("/manage");
          }}
        >
          Manage Passwords
        </li>
        <li
          
        >
          Import/Export Passwords
        </li>
        <li
          
          >
            Sync Passwords
          </li>
          <li
          
          >
            Change master Passwords
          </li>
      </ul>
    </>
  );
}

export default App;

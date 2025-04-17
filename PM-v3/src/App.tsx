// import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./App.css";
// import ManagePasswords from "./assets/components/ManagePasswords";

function App() {
  const navigate = useNavigate();

  const menu_list = [
    {
      id: "manage",
      text: "Manage Passwords",
      onclick: () => {
        navigate("/manage");
      },
    },
    {
      id: "import_export",
      text: "Import/Export Passwords",
      onclick: () => {},
    },
    {
      id: "sync",
      text: "Sync Passwords",
      onclick: () => {},
    },
    {
      id: "change_master_pass",
      text: "Change master Passwords",
      onclick: () => {},
    },
  ];

  return (
    <>
      <ul className="menu-list">
        {menu_list.map((op) => {
          return (
            <li
              key={op.id}
              onClick={() => {
                op.onclick();
              }}
            >
              {op.text}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default App;

// import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./App.css";
import { useRef, useState } from "react";
// import ManagePasswords from "./assets/components/ManagePasswords";

function App() {
  const navigate = useNavigate();
  const [subMenuSelected, setSubMenuSelected] = useState(0);
  const subMenuRef = useRef<any[]>([]);

  function copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log("Text copied to clipboard");
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  }
  const downloadJsonAsFile = (jsonContent: {}, fileName: string) => {
    // Create a Blob containing the JSON content
    const blob = new Blob([JSON.stringify(jsonContent)], {
      type: "application/json",
    });

    // Create a Blob URL for the Blob
    const blobUrl = URL.createObjectURL(blob);

    // Create an <a> element
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "data.json"; // Set the download attribute with a default file name if not provided

    // Append the <a> element to the document
    document.body.appendChild(a);

    // Trigger a click event on the <a> element to simulate a download
    a.click();

    // Remove the <a> element from the document
    document.body.removeChild(a);

    // Optionally revoke the Blob URL after simulating the download
    URL.revokeObjectURL(blobUrl);
  };

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
      onclick: () => {
        setSubMenuSelected(1);
        subMenuRef.current = [
          {
            id: "import",
            text: "Import",
            onclick: () => {
              //needs to go to import page
            },
          },
          {
            id: "exoprt",
            text: "Export",
            onclick: () => {
              setSubMenuSelected(2);
              subMenuRef.current = [
                {
                  id: "export encrypted",
                  text: "Export Encrypted DB",
                  onclick: () => {
                    setSubMenuSelected(3);
                    subMenuRef.current = [
                      {
                        id: "copy to clipboard",
                        text: "copy to clipboard",
                        onclick: () => {},
                      },
                      {
                        id: "save to encrypted file",
                        text: "save to encrypted file",
                        onclick: () => {},
                      },
                    ];
                  },
                },
                {
                  id: "export decrypted",
                  text: "Export Decrypted DB",
                  onclick: () => {
                    //needs to go to login page
                  },
                },
              ];
            },
          },
        ];
      },
    },
    {
      id: "sync",
      text: "Sync Passwords",
      onclick: () => {
        //go to sync page
      },
    },
    {
      id: "change_master_pass",
      text: "Change master Passwords",
      onclick: () => {
        //go to another page
      },
    },
  ];

  return subMenuSelected === 0 ? (
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
  ) : (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => setSubMenuSelected(0)}
      >
        Go back
      </button>
      <ul className="menu-list">
        {subMenuRef.current.map((op) => {
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

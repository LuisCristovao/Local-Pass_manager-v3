// import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./App.css";
import { useRef, useState } from "react";
import * as DB from "./assets/utils/dbUtils";
// import * as Crypto from "./assets/utils/cryptoUtils";
// import ManagePasswords from "./assets/components/ManagePasswords";

function App() {
  const navigate = useNavigate();

  const historyRef = useRef(["main"]);


  // function copyToClipboard(text: string) {
  //   if (navigator.clipboard) {
  //     navigator.clipboard
  //       .writeText(text)
  //       .then(() => {
  //         console.log("Text copied to clipboard");
  //       })
  //       .catch((err) => {
  //         console.error("Failed to copy text: ", err);
  //       });
  //   }
  // }

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


  const menu_options:any = {
    main: [
      {
        id: "manage",
        text: "Manage Passwords",
        onclick: () => {
          navigate("/manage");
        },
      },
      {
        id: "other_options",
        text: "Other Options",
        onclick: () => {
          setMenuItems(menu_options["other_options"]);
          const new_history = [...historyRef.current, "other_options"];
          historyRef.current = new_history;
        },
      },
      {
        id: "sync",
        text: "Sync Passwords",
        onclick: () => {
          //go to sync page
          navigate("/syncPass")
        },
      },
      
    ],
    other_options:[
      {
        id: "import",
        text: "Import Data",
        onclick: () => {
          setMenuItems(menu_options["import"]);
          const new_history = [...historyRef.current, "import"];
          historyRef.current = new_history;
        },
      },
      {
        id: "export",
        text: "Export Data",
        onclick: () => {
          setMenuItems(menu_options["export"]);
          const new_history = [...historyRef.current, "export"];
          historyRef.current = new_history;
        },
      },
      // {
      //   id: "change_master_pass",
      //   text: "Change master Passwords",
      //   onclick: () => {
      //     //go to another page
      //   },
      // },
      {
        id: "delete_db",
        text: "Delete Local Data",
        onclick: async() => {
          //do code here
          const result=confirm("Are you sure you want to delete the Data Base?")
          if (result) {
            try {
              await DB.clearDatabase();
              alert("Database deleted successfully!");
            } catch (error) {
              alert("Failed to delete the database: " + (error as Error).message);
            }
          }
          
        },
      },
    ],
    
    export: [
      {
        id: "export encrypted",
        text: "Export encrypted DB",
        onclick: async () => {
          const data = await DB.load()
          downloadJsonAsFile(data,"db_encrypted.json")
        },
      },
      {
        id: "export decrypted",
        text: "Export Decrypted DB",
        onclick: () => {
          //change page
          navigate("/exportD")
        },
      },
    ],
    import:[
      {
        id: "import encrypted",
        text: "Import encrypted DB",
        onclick: async () => {
         //new page
         navigate("/ImportE")
        },
      },
      {
        id: "import decrypted",
        text: "Import Decrypted DB",
        onclick: () => {
          //change page
          navigate("/ImportD")
        },
      },
    ]
  };
  const [menuItems, setMenuItems]: any[] = useState(menu_options["main"]);

  

  return (
    <>
      {historyRef.current.length > 1 && (
        <button
          style={{ position: "absolute", top: "10px", left: "10px" }}
          onClick={() => {
            const new_history = [...historyRef.current];
            new_history.pop();
            historyRef.current = new_history;
            const last_history = new_history[new_history.length - 1];

            setMenuItems(menu_options[last_history]);
          }}
        >
          Go back
        </button>
      )}
      <ul className="menu-list">
        {menuItems.map((op: any) => {
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

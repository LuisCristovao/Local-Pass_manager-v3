import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";

import { useNavigate } from "react-router-dom"; // Add this import
import InsertPassword from "./InsertPassword";

function ImportDecrypted() {
  
  const [state, setState] = useState("intro");
  const userPassRef = useRef<string>(""); // default value is an empty string
  const navigate = useNavigate();


  const [success, setSuccess] = useState<string>("nothing");
  
    const overwrite = async (encrypted_data: string) => {
      if (encrypted_data !== "") {
        const encrypted_data_json: [] = JSON.parse(encrypted_data);
        //clear db then append  records
        try {
          DB.clearDatabase();
  
          encrypted_data_json.forEach((record) => {
            DB.add(record);
          });
  
          return "success";
        } catch (err) {
          return "error";
        }
      }
      return "nothing";
    };
  
    const append = async (encrypted_data: string) => {
      if (encrypted_data !== "") {
        const encrypted_data_json: [] = JSON.parse(encrypted_data);
        //append to the db the records
        try {
          encrypted_data_json.forEach((record) => {
            DB.add(record);
          });
          return "success";
        } catch (err) {
          return "error";
        }
      }
      return "nothing";
    };
    
  
    const renderSuccessMessage=() =>{
      if (success === "success") {
        return <p>Success </p>;
      } else if (success === "error") {
        return <p>Error </p>;
      } else if (success === "nothing") {
        return null;
      } else {
        return null;
      }
    }
  
  //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }

  return state==="intro" ? (
    <InsertPassword
    userPassRef={userPassRef}
    setState={setState}
    />
  ):(
    <>
    <button
      style={{ position: "absolute", top: "10px", left: "10px" }}
      onClick={() => {
        navigate("/");
      }}
    >
      Go back
    </button>
    <h1>Import Passwords</h1>
    <p >Data splitting character: <input id="spliting character" type="text" value="\t" style={{width:"20px"}}/></p>
    <textarea
      id="import encrypted data"
      style={{
        height: "350px",
        width: "60%",
        maxWidth: "800px",
        minWidth: "300px",
        marginBottom: "20px",
        backgroundColor: "transparent",
        fontSize: "1.5em",
        color:"aliceblue"
      }}
      placeholder="Insert Encrypted JSON here..."
    ></textarea>
    <div
      style={{
        gap: "30px",
        display: "flex",
      }}
    >
      <button
        onClick={async () => {
          const textarea = document.getElementById(
            "import encrypted data"
          ) as HTMLTextAreaElement;
          const output = await overwrite(textarea.value);
          setSuccess(output);
        }}
      >
        Overwrite
      </button>
      <button
        onClick={async () => {
          const textarea = document.getElementById(
            "import encrypted data"
          ) as HTMLTextAreaElement;
          const output = await append(textarea.value);
          setSuccess(output);
        }}
      >
        Append
      </button>
    </div>
    {
      renderSuccessMessage()
    }
  </>
  )
}

export default ImportDecrypted;

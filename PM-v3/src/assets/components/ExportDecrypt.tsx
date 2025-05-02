import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { useNavigate } from "react-router-dom"; // Add this import
import InsertPassword from "./InsertPassword";

function ExportDecrypted() {
  const [state, setState] = useState("intro");
  const userPassRef = useRef("");
  

  const navigate = useNavigate();
  
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

   const decryptAllPasswords = async () => {
      
    
      const data = await DB.load(); // <-- freshly loaded passwords
  
      const decrypted = await Promise.all(
        data.map(async (p) => ({
          id: p.id,
          data: await Crypto.decrypt(p.data, userPassRef.current),
        }))
      );
      const decrypt_json=decrypted.map(el=>{
        const info:{
          site:string,
          user:string,
          pass:string,
          comments:string,
          timestamp:string,
          sync:string,
          is_deleted:string
        }= JSON.parse(el.data || "")
        return {
          id:el.id,
          site:info.site,
          user:info.user,
          pass:info.pass,
          comments:info.comments,
          timestamp:info.timestamp,
          sync:info.sync,
          is_deleted:info.is_deleted
        }
  
      })
      
    
      downloadJsonAsFile(decrypt_json,"decrypted_passwords.json")
      
    };



  return state === "intro" ? (
    <InsertPassword userPassRef={userPassRef} setState={setState} />
  ) : (
    <>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => {
          navigate("/");
        }}
      >
        Go back
      </button>
      <button
      onClick={async ()=>{
        await decryptAllPasswords()
      }}
      
      >Export Decrypted DB</button>
    </>
  );
}

export default ExportDecrypted;

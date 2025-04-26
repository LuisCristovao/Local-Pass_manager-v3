import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { useNavigate } from "react-router-dom"; // Add this import

function ImportEncrypted(){

    //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }

    const [success,setSuccess]= useState<string>("nothing")

    
    const  sync=async(encrypted_data_json:[])=>{

        if (await DB.databaseExists()){
            //compare if the sync filed is the same and add new 
            //update old records with new ones 


        }else{
            //import all records to database
            encrypted_data_json.forEach(record=>{
                DB.add(record)
            })
        }


        return "success"
    }
    const navigate = useNavigate();

    return (
        <>
        <button
          style={{ position: "absolute", top: "10px", left: "10px" }}
          onClick={() => {
            navigate("/")
          }}
        >
          Go back
        </button>
        <h1>Import Passwords</h1>
        <textarea
        id="import encrypted data"
        style={{
            height:"350px",
            width:"60%",
            maxWidth:"800px",
            minWidth:"300px",
            marginBottom:"20px",
            backgroundColor:"transparent",
            fontSize:"1.5em"
        }}
        placeholder="Insert Encrypted JSON here..."
        ></textarea>
        <div style={{
            gap:"30px",
            display:"flex"
        }}>
        <button
        onClick={()=>{
            // const textarea=document.getElementById("import encrypted data") as HTMLTextAreaElement
            // setSuccess(()=>{
            //     return sync(textarea.value)
            // })
            
        }}
        >Overwrite</button>
        <button>Append</button>
        </div>
        
        </>
    )




}
export default ImportEncrypted;
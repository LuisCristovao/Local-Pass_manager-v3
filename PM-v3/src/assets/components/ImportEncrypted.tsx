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

    
    const sync=(encrypted_data_json:{})=>{


        return "success"
    }


    return (
        <>
        <h1>Import Passwords</h1>
        <textarea
        id="import encrypted data"
        style={{
            height:"350px",
            width:"60%",
            maxWidth:"800px",
            minWidth:"500px",
            marginBottom:"20px",
            backgroundColor:"transparent",
            fontSize:"1.5em"
        }}
        placeholder="Insert Encrypted JSON here..."
        ></textarea>
        <button
        onClick={()=>{
            const textarea=document.getElementById("import encrypted data") as HTMLTextAreaElement
            setSuccess(()=>{
                return sync(textarea.value)
            })
            
        }}
        >Import</button>
        </>
    )




}
export default ImportEncrypted;
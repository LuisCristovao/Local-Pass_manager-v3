import { encrypt, decrypt, sha256 } from "../utils/cryptoUtils.ts";
import { useEffect,useState } from "react";
import { add, load, update, remove } from "../utils/dbUtils";



function ManagePasswords() {
  const pages:any ={
    intro:()=>{
        return (
            <>
            <h1>Manage Passwords</h1>
            <button
            onClick={()=>{setState("start")}}
            >Change State</button>
          </>
        )
    },
    start:()=>{
        return (
            <>
            <h1>Start Passwords</h1>
            <button
            onClick={()=>{setState("intro")}}
            >Change State</button>
          </>
        )
    },
    
  }
  const [state,setState] = useState("intro")

  return pages[state]()
}

export default ManagePasswords;

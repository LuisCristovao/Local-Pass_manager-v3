import { useEffect, useState } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";

function ManagePasswords() {
  const [state, setState] = useState("intro");
  const [passwords, setPasswords] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);


   const Encrypt:any = async(secret:string,pass:string)=>{

        return await Crypto.encrypt(secret,pass)
        

   } 


  // Load passwords on mount
  useEffect(() => {
    const fetchData = async () => {
      const data = await DB.load();
      setPasswords(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const pages: any = {
    intro: () => {
      if (loading) return <p>Loading...</p>;

      if (passwords.length === 0) {
        return (
          <>
            <h1>No Passwords yet</h1>
            <button onClick={() => setState("start")}>Go to Start</button>
          </>
        );
      }

      return (
        <>
          <h1>Manage Passwords</h1>
          <ul>
            {passwords.map((p, i) => (
              <li key={p.id || i}>{p.name}</li>
            ))}
          </ul>
          <button onClick={() => setState("start")}>Go to Start</button>
        </>
      );
    },

    start: () => (
      <>
        <h1>Start Page</h1>
        <button onClick={() => setState("intro")}>Back to Intro</button>
      </>
    ),
  };

  return pages[state]();
}

export default ManagePasswords;

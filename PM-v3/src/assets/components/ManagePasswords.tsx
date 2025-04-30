import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import "../css/ManagePasswords.css";
import { useNavigate } from "react-router-dom"; // Add this import
import * as Search from "../utils/searchUtils";
import PassRecord from "./PassRecord";
import InsertPassword from "./InsertPassword";

function ManagePasswords() {
  const [state, setState] = useState("intro");
  
  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Record<string, any>[]
  >([]);
  const userPassRef = useRef<string>(""); // default value is an empty string
  const storedPasswords = useRef<Record<string, any>[]>([]); // default value is an empty string

  const [editRecordId, setEditRecordId] = useState("");

  const navigate = useNavigate();

  const decryptAllPasswords = async () => {
    const start = performance.now(); // Start timing
  
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
    storedPasswords.current = decrypt_json;
    setDecryptedPasswords(decrypt_json);
  
    const end = performance.now(); // End timing
    const duration = end - start;
    console.log(`Decryption completed in ${duration > 1000 ? (duration / 1000).toFixed(2) + 's' : duration.toFixed(2) + ' ms'}`);
  };
  
  

  //decrypt passwords in manage state
  useEffect(() => {
    if (state === "manage") {
      //change root height
      const root = document.getElementById("root");
      if (root) root.style.minHeight = "50vh";

      decryptAllPasswords();
    }

    return () => {
      const root = document.getElementById("root");
      if (root) root.style.minHeight = "70vh"; // restore default on unmount
    };
  }, [state]);

  //reset to intro statge after 10 min of no input from user
  useEffect(() => {
    if (state !== "manage") return;

    let timeout: number;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setState("intro"); // auto-reset after 10 mins of inactivity
      }, 10 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start the initial timer

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [state]);

  const pages: any = {
    intro: () => {
      return (
      <InsertPassword 
      userPassRef={userPassRef}
      setState={setState}
      />)
    },

    manage: () => {
      return (
        <>
          <button
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => navigate("/")}
          >
            Go back
          </button>
          <h1>Manage Passwords</h1>
          <input
            type="text"
            placeholder="Search"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              const search_text = target.value;
              if (search_text !== "") {
                const found_indexes = Search.findBestMatchs(
                  storedPasswords.current,
                  search_text
                );
                const filtered = found_indexes.map(
                  (i) => storedPasswords.current[i]
                );
                setDecryptedPasswords(filtered);
              } else {
                setDecryptedPasswords(storedPasswords.current);
              }
            }}
          />
          <div>
            <button
              style={{ marginBottom: "30px" }}
              onClick={() => setState("record")}
            >
              Add record
            </button>
          </div>

          <div className="passwords-list">
            {decryptedPasswords
              .filter((p) => p.is_deleted === "false")
              .map((p) => (
                <div className="list-element" key={p.id}>
                  <p className="site" style={{ textAlign: "center" }}>
                    <b>{p.site}</b>
                  </p>
                  <p className="comments">{p.comments}</p>
                  <button
                    style={{ margin: "0 auto", marginTop: "10px" }}
                    onClick={() => {
                      setEditRecordId(p.id);
                      setState("edit_record");
                    }}
                  >
                    Open
                  </button>
                </div>
              ))}
          </div>
        </>
      );
    },
    record: () => {
      return (
        <PassRecord
          edit={false}
          userPassRef={userPassRef}
          setState={setState}
          editRecordId={editRecordId}
          decryptedPasswords={decryptedPasswords}
        />
      );
    },
    edit_record: () => {
      return (
        <PassRecord
          edit={true}
          userPassRef={userPassRef}
          setState={setState}
          editRecordId={editRecordId}
          decryptedPasswords={decryptedPasswords}
        />
      );
    },
  };

  //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }

  return pages[state]();
}

export default ManagePasswords;

import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import "../css/ManagePasswords.css";
import { useNavigate } from "react-router-dom"; // Add this import
import * as Search from "../utils/searchUtils";
import PassRecord from "./PassRecord";

function ManagePasswords() {
  const [state, setState] = useState("intro");
  const [passwords, setPasswords] = useState<Record<string, any>[]>([]);
  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Record<string, any>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [wrong_pass, setwrongPass] = useState(false);
  const userPassRef = useRef<string>(""); // default value is an empty string
  const storedPasswords = useRef<Record<string, any>[]>([]); // default value is an empty string
 
  const [editRecordId, setEditRecordId] = useState("");

  const navigate = useNavigate();

  const decryptAllPasswords = async () => {
    const data = await DB.load(); // <-- freshly loaded passwords

    const decrypted = await Promise.all(
      data.map(async (p) => ({
        id: p.id,
        site: await Crypto.decrypt(p.site, userPassRef.current),
        user: await Crypto.decrypt(p.user, userPassRef.current),
        pass: await Crypto.decrypt(p.pass, userPassRef.current),
        comments: await Crypto.decrypt(p.comments, userPassRef.current),
        timestamp: await Crypto.decrypt(p.timestamp, userPassRef.current),
        sync: p.sync,
      }))
    );
    storedPasswords.current = decrypted;
    setDecryptedPasswords(decrypted);
  };

  //decrypt passwords in manage state
  useEffect(() => {
    if (state === "intro") {
      // Load passwords on mount
      const fetchData = async () => {
        const data = await DB.load();
        setPasswords(data);
        setLoading(false);
      };

      fetchData();
    }
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
      if (loading) return <p>Loading...</p>;

      if (passwords.length === 0) {
        return (
          <>
            <h1>No Passwords yet</h1>
            <input
              type="password"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  userPassRef.current = target.value;
                  console.log("Saved password:", userPassRef.current);
                  setState("manage");
                }
              }}
            ></input>
          </>
        );
      }
      // already has password
      return (
        <>
          <h1>Insert Master Password</h1>
          <input
            type="password"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const target = e.target as HTMLInputElement;
                userPassRef.current = target.value;

                const canAccess = await Crypto.canDecrypt(
                  passwords[0].site,
                  userPassRef.current
                );

                if (canAccess) {
                  setState("manage");
                } else {
                  console.warn("Wrong password");
                  // Optional: show error to user
                  setwrongPass(true);
                  setTimeout(() => {
                    setwrongPass(false);
                  }, 1000);
                }
              }
            }}
          ></input>
          {wrong_pass && <p>wrong pass</p>}
        </>
      );
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
            {decryptedPasswords.map((p) => (
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
          storedPasswords={storedPasswords}
          setDecryptedPasswords={setDecryptedPasswords}
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
          storedPasswords={storedPasswords}
          setDecryptedPasswords={setDecryptedPasswords}
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

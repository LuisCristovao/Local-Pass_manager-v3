import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import "../css/ManagePasswords.css";
import { useNavigate } from "react-router-dom"; // Add this import

function ManagePasswords() {
  const [state, setState] = useState("intro");
  const [passwords, setPasswords] = useState<Record<string, any>[]>([]);
  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Record<string, any>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [wrong_pass, setwrongPass] = useState(false);
  const userPassRef = useRef<string>(""); // default value is an empty string

  const navigate = useNavigate();

  const handleSubmit = async () => {
    const site = (document.getElementById("site_input") as HTMLInputElement)
      .value;
    const user = (document.getElementById("user_input") as HTMLInputElement)
      .value;
    const pass = (document.getElementById("pass_input") as HTMLInputElement)
      .value;
    const comments = (
      document.getElementById("comments_input") as HTMLTextAreaElement
    ).value;

    const password = userPassRef.current;
    if (!password) {
      alert("Password is not set.");
      return;
    }

    const input_data = {
      site: await Crypto.encrypt(site, password),
      user: await Crypto.encrypt(user, password),
      pass: await Crypto.encrypt(pass, password),
      comments: await Crypto.encrypt(comments, password),
    };

    // You could now store input_data into IndexedDB, etc.
    await DB.add(input_data);
    setState("manage");
  };

  const decryptAllPasswords = async () => {
    const data = await DB.load(); // <-- freshly loaded passwords

    const decrypted = await Promise.all(
      data.map(async (p) => ({
        id: p.id,
        site: await Crypto.decrypt(p.site, userPassRef.current),
        user: await Crypto.decrypt(p.user, userPassRef.current),
        pass: await Crypto.decrypt(p.pass, userPassRef.current),
        comments: await Crypto.decrypt(p.comments, userPassRef.current),
      }))
    );
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
      const root = document.getElementById('root');
      if (root) root.style.minHeight = '50vh';

      decryptAllPasswords();
    }

    return () => {
      const root = document.getElementById('root');
      if (root) root.style.minHeight = '70vh'; // restore default on unmount
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
            style={{ position: "fixed", top: "10px", left: "10px" }}
            onClick={() => navigate("/")}
          >
            Go back
          </button>
          <h1>Manage Passwords</h1>
          <input type="text" placeholder="Search"/> 
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
                {p.site}
              </div>
            ))}
          </div>
        </>
      );
    },
    record: () => {
      return (
        <>
          <div>
            <p>Site</p>
            <input id="site_input" />

            <p>User</p>
            <input id="user_input" />

            <p>Pass</p>
            <input id="pass_input" />

            <p>Comments</p>
            <textarea id="comments_input"></textarea>

            <button onClick={handleSubmit}>Submit</button>
          </div>
        </>
      );
    },
  };

  return pages[state]();
}

export default ManagePasswords;

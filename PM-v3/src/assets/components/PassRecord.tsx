import { useEffect, useState, useRef,RefObject } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";

// Define the props interface
interface PassRecordProps {
    edit: boolean;
    storedPasswords: RefObject<Record<string, any>[]>; // Replace `any` with a specific type if possible
    setDecryptedPasswords: any; // Replace `any` with specific type
    userPassRef: React.RefObject<string>; // Adjust based on the ref's type
    setState: React.Dispatch<React.SetStateAction<string>>; // ✅ typed! // Replace `any` with specific state type
    editRecordId: string | undefined; // Adjust based on actual type
    decryptedPasswords: any[]; // Replace `any` with specific type
  }
  
  // Define the component with React.FC and the props interface
  const PassRecord: React.FC<PassRecordProps> = ({
  edit,
  storedPasswords,
  setDecryptedPasswords,
  userPassRef,
  setState,
  editRecordId,
  decryptedPasswords
})=> {
  const [copyUserText, setCopyUserText] = useState("Copy Username");
  const [copyPassText, setCopyPassText] = useState("Copy Password");
  const copyInputValue = async (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) {
      try {
        await navigator.clipboard.writeText(input.value);
        console.log(`Value from ${inputId} copied to clipboard`);
      } catch (err) {
        console.error(`Failed to copy from ${inputId}: `, err);
      }
    } else {
      console.error(`Input element with ID ${inputId} not found`);
    }
  };

  const handleSubmit = async (id: string = "") => {
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
    if (id === "") {
      await DB.add(input_data);
    } else {
      await DB.update(id, input_data);
    }

    setState("manage");
  };

  const handleDelete = async (id: string = "") => {
    // Basic confirm dialog
    let result = confirm("Are you sure you want to delete this record?");

    // Handling the response
    if (result) {
      // delete
      await DB.remove(id);
      setState("manage");
    } else {
    }
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
    storedPasswords.current = decrypted;
    setDecryptedPasswords(decrypted);
  };
  const data = decryptedPasswords.filter((el:any) => {
    return el.id === editRecordId;
  })[0];

  return edit ? (
    <>
      <div className="details-container">
        <button
          className="back-button"
          onClick={() => {
            setState("manage");
          }}
        >
          &lt;
        </button>

        <div className="entry-box">
          <input
            className="site-input"
            type="text"
            placeholder="site/page ..."
            id="site_input"
            defaultValue={data.site}
          />

          <textarea
            className="description-text"
            placeholder="Description ..."
            id="comments_input"
            defaultValue={data.comments}
          />

          <div className="action-row">
            <button
              className="btn"
              onClick={() => {
                copyInputValue("user_input");
                setCopyUserText("Copied!");
                setTimeout(() => setCopyUserText("Copy Username"), 1000);
              }}
            >
              {copyUserText}
            </button>
            <input
              className="small-input"
              placeholder="username"
              id="user_input"
              defaultValue={data.user}
            />
          </div>

          <div className="action-row">
            <button
              className="btn"
              onClick={() => {
                copyInputValue("pass_input");
                setCopyPassText("Copied!");
                setTimeout(() => setCopyPassText("Copy Password"), 1000);
              }}
            >
              {copyPassText}
            </button>
            <input
              className="small-input"
              placeholder="password"
              id="pass_input"
              defaultValue={data.pass}
            />
          </div>

          <div className="edit-buttons">
            <button
              className="btn small"
              onClick={() => {
                handleSubmit(editRecordId);
              }}
            >
              Submit
            </button>
            <button
              className="btn small delete"
              onClick={() => {
                handleDelete(editRecordId);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  ) : (
    <>
    <div className="details-container">
          <button
            className="back-button"
            onClick={() => {
              setState("manage");
            }}
          >
            &lt;
          </button>

          <div className="entry-box">
            <input
              className="site-input"
              type="text"
              placeholder="site/page ..."
              id="site_input"
            />

            <textarea
              className="description-text"
              placeholder="Description ..."
              id="comments_input"
            />

            <div className="action-row">
              <button
                className="btn"
                onClick={() => {
                  copyInputValue("user_input");
                  setCopyUserText("Copied!");
                  setTimeout(() => setCopyUserText("Copy Username"), 1000);
                }}
              >
                {copyUserText}
              </button>
              <input
                className="small-input"
                placeholder="username"
                id="user_input"
              />
            </div>

            <div className="action-row">
              <button
                className="btn"
                onClick={() => {
                  copyInputValue("pass_input");
                  setCopyPassText("Copied!");
                  setTimeout(() => setCopyPassText("Copy Password"), 1000);
                }}
              >
                {copyPassText}
              </button>
              <input
                className="small-input"
                placeholder="password"
                id="pass_input"
              />
            </div>

            <div className="edit-buttons">
              <button
                className="btn small"
                onClick={() => {
                  handleSubmit();
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
    </>
  );
}

export default PassRecord;

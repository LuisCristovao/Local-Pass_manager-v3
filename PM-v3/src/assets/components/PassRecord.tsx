import { useState } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";

// Define the props interface
interface PassRecordProps {
  edit: boolean;
  userPassRef: React.RefObject<string>; // Adjust based on the ref's type
  setState: React.Dispatch<React.SetStateAction<string>>; // ✅ typed! // Replace `any` with specific state type
  editRecordId: string | undefined; // Adjust based on actual type
  decryptedPasswords: any[]; // Replace `any` with specific type
}

// Define the component with React.FC and the props interface
const PassRecord: React.FC<PassRecordProps> = ({
  edit,
  userPassRef,
  setState,
  editRecordId,
  decryptedPasswords,
}) => {
  const [copyUserText, setCopyUserText] = useState("Copy Username");
  const [copyPassText, setCopyPassText] = useState("Copy Password");
  const [submitButtonText, setSubmitButtonText] = useState("Edit");
  const [submitButtonText2, setSubmitButtonText2] = useState("Submit");

  const [isHoverSubmitButton, setIsHoverSubmitButton] = useState(false);






  

  const copyInputValue = async (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) {
      console.error(`Input element with ID ${inputId} not found`);
      return;
    }

    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(input.value);
        console.log(`Value from ${inputId} copied to clipboard`);
      } catch (err) {
        console.error(`Failed to copy from ${inputId}: `, err);
      }
    } else {
      // Fallback for older browsers
      try {
        input.select(); // Select the input content
        document.execCommand("copy"); // Deprecated but works in some older browsers
        console.log(`Value from ${inputId} copied using fallback`);
      } catch (err) {
        console.error(`Fallback copy failed for ${inputId}: `, err);
      }
    }
  };

  const input_styles: { [key: string]: () => React.CSSProperties } = {
    Edit: () => {
      return {
        height: `0px`,
        margin: `0`,
        opacity: `0`,
      };
    },
    Submit: () => {
      return {
        height: ``,
        margin: ``,
        opacity: `1`,
      };
    },
    "Saved!": () => {
      return {
        height: `0px`,
        margin: `0`,
        opacity: `0`,
      };
    },
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
      site: site,
      user: user,
      pass: pass,
      comments: comments,
      timestamp: Date.now().toString(),
      sync: await Crypto.sha256(
        "".concat(site).concat(user).concat(pass).concat(comments)
      ),
      is_deleted: "false",
    };

    // You could now store input_data into IndexedDB, etc.
    if (id === "") {
      await DB.add(input_data,password);
      setSubmitButtonText2(() => {
        setTimeout(() => {
          setSubmitButtonText2("Submit");
        }, 1000);
        return "Saved!";
      });
      setState("manage");
    } else {
      await DB.update(id, input_data,password);
      setSubmitButtonText(() => {
        setTimeout(() => {
          setSubmitButtonText("Edit");
        }, 1000);
        return "Saved!";
      });
    }
  };

  const handleDelete = async (id: string = "") => {
    // Basic confirm dialog
    let result = confirm("Are you sure you want to delete this record?");

    // Handling the response
    if (result) {
      // delete is just update the is_deleted field and remove data
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
        site: "",
        user: "",
        pass: "",
        comments: "",
        timestamp: await Crypto.encrypt(Date.now().toString(), password),
        sync: await Crypto.sha256(
          "".concat(site).concat(user).concat(pass).concat(comments)
        ),
        is_deleted: await Crypto.encrypt("true", password),
      };
      await DB.update(id, input_data);
      //complet delete
      //await DB.remove(id);
      setState("manage");
    } else {
    }
  };

  function RandomPass(size: number) {
    var text = "";
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()/%&$#@=[]{} ";

    for (var i = 0; i < size; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  function randomPassEvent(input: any) {
    if (input.target.value.search(/random\([0-9]+\)/i) != -1) {
      let length = parseInt(input.target.value.replace(/\D/g, ""));
      input.target.value = RandomPass(length);
    }
  }
  const formatTimestamp = (timestamp: string | number): string => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    const date = new Date(ts);
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  

  //obtain data for the edit
  let data;
  if (edit && editRecordId != undefined) {
    // if edit record
    data = decryptedPasswords.filter((el: any) => {
      return el.id === editRecordId;
    })[0];
  } else {
    //if new record
    // setSubmitButtonText("Submit")
  }

  return edit ? (
    <>
      <div className="details-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <button
            className="back-button"
            onClick={() => {
              setState("manage");
            }}
          >
            &lt;
          </button>
          <p style={{ margin: 0 }}>{formatTimestamp(data.timestamp)}</p>
        </div>

        <div className="entry-box">
          <input
            className="site-input"
            type="text"
            placeholder="site/page ..."
            id="site_input"
            defaultValue={data.site}
            onInput={() => {
              handleSubmit(editRecordId);
            }}
          />

          <textarea
            className="description-text"
            placeholder="Description ..."
            id="comments_input"
            defaultValue={data.comments}
            onInput={() => {
              handleSubmit(editRecordId);
            }}
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
              style={input_styles[submitButtonText]()}
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
              onInput={(e) => {
                randomPassEvent(e);
              }}
              style={input_styles[submitButtonText]()}
            />
          </div>

          <div className="edit-buttons">
            <button
              id="submit_button"
              className="btn small"
              onClick={() => {
                if (submitButtonText === "Edit") {
                  setSubmitButtonText("Submit");
                } else if (submitButtonText === "Submit") {
                  handleSubmit(editRecordId);
                }
              }}
              onMouseEnter={() => {
                setIsHoverSubmitButton(true);
              }}
              onMouseLeave={() => {
                setIsHoverSubmitButton(false);
              }}
              style={{
                color: `${
                  submitButtonText === "Saved!"
                    ? "green"
                    : isHoverSubmitButton
                    ? "black"
                    : "white"
                }`,
                border: `${
                  submitButtonText === "Saved!"
                    ? "2px solid green"
                    : "2px solid white"
                }`,
              }}
            >
              {submitButtonText}
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
              onInput={(e) => {
                randomPassEvent(e);
              }}
            />
          </div>

          <div className="edit-buttons">
            <button
              id="submit_button"
              className="btn small"
              onClick={() => {
                handleSubmit();
              }}
              onMouseEnter={() => {
                setIsHoverSubmitButton(true);
              }}
              onMouseLeave={() => {
                setIsHoverSubmitButton(false);
              }}
              style={{
                color: `${
                  submitButtonText2 === "Saved!"
                    ? "green"
                    : isHoverSubmitButton
                    ? "black"
                    : "white"
                }`,
                border: `${
                  submitButtonText2 === "Saved!"
                    ? "2px solid green"
                    : "2px solid white"
                }`,
              }}
            >
              {submitButtonText2}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PassRecord;

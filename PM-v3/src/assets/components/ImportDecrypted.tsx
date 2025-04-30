import { useEffect, useState, useRef } from "react";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { useNavigate } from "react-router-dom"; // Add this import
import InsertPassword from "./InsertPassword";

function ImportDecrypted() {
  const [state, setState] = useState("intro");
  const userPassRef = useRef<string>(""); // default value is an empty string
  const navigate = useNavigate();

  const [success, setSuccess] = useState<string>("nothing");

  

  /**
   * Replaces all occurrences of 'search' with 'replacement' inside 'str'.
   * This does not modify String.prototype. It works safely across all environments.
   *
   * @param str - The input string to operate on
   * @param search - The substring to find
   * @param replacement - The string to replace all found substrings with
   * @returns A new string with all occurrences replaced
   */
  const replaceAll = (
    str: string,
    search: string,
    replacement: string
  ): string => {
    return str.split(search).join(replacement);
  };

  /**
   * Converts a CSV string into an array of plain objects.
   * Encrypts each field using Crypto.encrypt(value, password).
   *
   * @param csv - The CSV input string
   * @param delimiter - The delimiter between fields
   
   * @returns A Promise resolving to an array of encrypted objects
   */
  const csvToJson = async (
    csv: string,
    delimiter: string
  ): Promise<any[]> => {
    const normalizedCsv =
      delimiter !== "\t" ? replaceAll(csv, delimiter, "\t") : csv;

    const lines = normalizedCsv.trim().split("\n");

    const result = await Promise.all(
      lines.map(async (line) => {
        const values = line
          .split("\t")
          .map((v) => v.trim().replace(/\\n/g, "\n"));
  
        const plainObject = {
          site: values[0] || "",
          user: values[1] || "",
          pass: values[2] || "",
          comments: values[3] || "",
          timestamp: Date.now().toString(),
          is_deleted: "false",
          sync:""
        };
  
        plainObject.sync = await Crypto.sha256(
          plainObject.site + plainObject.user + plainObject.pass + plainObject.comments
        );
  
        // const encrypted = await Crypto.encrypt(JSON.stringify(plainObject), password);
        return plainObject;
      })
    );

    return result;
  };

  const overwrite = async (raw_data: string) => {
    const delimiter = document.getElementById(
      "spliting character"
    ) as HTMLInputElement;
    if (raw_data !== "") {
      const json_data = await csvToJson(
        raw_data,
        delimiter.value
      );
      
      //clear db then append  records
      try {
        DB.clearDatabase();
        json_data.forEach((record) => {
          DB.add(record,userPassRef.current);
        });

        return "success";
      } catch (err) {
        return "error";
      }
    }
    return "nothing";
  };

  const append = async (raw_data: string) => {


    const delimiter = document.getElementById(
      "spliting character"
    ) as HTMLInputElement;

    if (raw_data !== "") {
      const json_data = await csvToJson(
        raw_data,
        delimiter.value,
        
      );
      
      //append to the db the records
      try {
        json_data.forEach((record) => {
          DB.add(record,userPassRef.current);
        });
        return "success";
      } catch (err) {
        return "error";
      }
    }
    return "nothing";
  };

  const renderSuccessMessage = () => {
    if (success === "success") {
      return <p>Success </p>;
    } else if (success === "error") {
      return <p>Error </p>;
    } else if (success === "nothing") {
      return null;
    } else {
      return null;
    }
  };

  //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }

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
      <h1>Import Passwords</h1>
      <p>
        Data splitting character:{" "}
        <input
          id="spliting character"
          type="text"
          defaultValue="\t"
          style={{ width: "20px" }}
        />
      </p>
      <textarea
        id="import encrypted data"
        style={{
          height: "350px",
          width: "60%",
          maxWidth: "800px",
          minWidth: "300px",
          marginBottom: "20px",
          backgroundColor: "transparent",
          fontSize: "1.5em",
          color: "aliceblue",
        }}
        placeholder={`site1\tuser1\tpass1\toptional comments 1
site2\tuser2\tpass2\toptional comments 2`}
        defaultValue={`site1\tuser1\tpass1\toptional comments 1
site2\tuser2\tpass2\toptional comments 2`}
      ></textarea>
      <div
        style={{
          gap: "30px",
          display: "flex",
        }}
      >
        <button
          onClick={async () => {
            const textarea = document.getElementById(
              "import encrypted data"
            ) as HTMLTextAreaElement;
            const output = await overwrite(textarea.value);
            setSuccess(output);
          }}
        >
          Overwrite
        </button>
        <button
          onClick={async () => {
            const textarea = document.getElementById(
              "import encrypted data"
            ) as HTMLTextAreaElement;
            const output = await append(textarea.value);
            setSuccess(output);
          }}
        >
          Append
        </button>
      </div>
      {renderSuccessMessage()}
    </>
  );
}

export default ImportDecrypted;

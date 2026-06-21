import { useState } from "react";
import * as DB from "../utils/dbUtils";
import { useNavigate } from "react-router-dom"; // Add this import

function ImportEncrypted() {
  //ONLY for development/debugging
  // if (typeof window !== "undefined") {
  //   (window as any).PM = { decryptedPasswords, Search };
  // }

  const [success, setSuccess] = useState<string>("nothing");

  type EncryptedRecord = {
    id: string;
    data: string;
    sync?: string;
    timestamp?: string;
    is_deleted?: string;
  };

  const isValidEncryptedRecord = (
    record: unknown,
  ): record is EncryptedRecord => {
    return (
      typeof record === "object" &&
      record !== null &&
      !Array.isArray(record) &&
      typeof (record as Record<string, unknown>).id === "string" &&
      typeof (record as Record<string, unknown>).data === "string"
    );
  };

  const parseAndValidate = (raw: string): EncryptedRecord[] => {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
    if (!parsed.every(isValidEncryptedRecord))
      throw new Error("Invalid record shape");
    return parsed;
  };

  const normalizeMetadata = (records: EncryptedRecord[]): EncryptedRecord[] => {
    return records.map((record) => ({
      id: record.id,
      data: record.data,
      ...(record.sync ? { sync: record.sync } : {}),
      ...(record.timestamp ? { timestamp: record.timestamp } : {}),
      ...(record.is_deleted ? { is_deleted: record.is_deleted } : {}),
    }));
  };

  const overwrite = async (encrypted_data: string) => {
    if (encrypted_data !== "") {
      try {
        const encrypted_data_json = parseAndValidate(encrypted_data);
        const normalized = normalizeMetadata(encrypted_data_json);
        await DB.clearDatabase();
        await Promise.all(normalized.map((record) => DB.add(record)));
        return "success";
      } catch (err) {
        return "error";
      }
    }
    return "nothing";
  };

  const append = async (encrypted_data: string) => {
    if (encrypted_data !== "") {
      try {
        const encrypted_data_json = parseAndValidate(encrypted_data);
        const normalized = normalizeMetadata(encrypted_data_json);
        await Promise.all(normalized.map((record) => DB.add(record)));
        return "success";
      } catch (err) {
        return "error";
      }
    }
    return "nothing";
  };
  const navigate = useNavigate();

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

  return (
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
        placeholder="Insert Encrypted JSON here..."
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
              "import encrypted data",
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
              "import encrypted data",
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
export default ImportEncrypted;

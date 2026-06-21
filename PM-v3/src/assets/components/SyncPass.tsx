import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import InsertPassword from "./InsertPassword";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { QRCodeSVG } from "qrcode.react";
import QrReader from "react-web-qr-reader";

type SyncState =
  | "loading"
  | "intro"
  | "scan"
  | "manage"
  | "manual_input"
  | "connecting"
  | "syncing"
  | "connected"
  | "error";

type SyncRecord = {
  id: string;
  site: string;
  user: string;
  pass: string;
  comments: string;
  timestamp: string;
  sync: string;
  is_deleted: string;
};

type SyncMeta = {
  id: string;
  sync: string;
  timestamp: string;
  is_deleted: string;
};

function SyncPass() {
  const [state, setState] = useState<SyncState>("loading");
  const [peerId, setPeerId] = useState<string>("");
  const [qr_value, setQRValue] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const remotePeerId = useRef<string>("");
  const peer = useRef<Peer | null>(null);
  const connectionRef = useRef<any>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const hasSyncedRef = useRef(false);
  const syncDoneRef = useRef(false);
  const userPassRef = useRef("");
  const otherDB = useRef<Record<string, any>[]>([]);

  const stateRef = useRef<SyncState>("loading");
  const navigate = useNavigate();

  const setStateAndRef = (s: SyncState) => {
    stateRef.current = s;
    setState(s);
  };

  const clearConnectTimeout = () => {
    if (connectTimeoutRef.current !== null) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  };

  const safeDisconnectConnection = () => {
    clearConnectTimeout();
    if (connectionRef.current) {
      try {
        connectionRef.current.close();
      } catch {
        // no-op
      }
      connectionRef.current = null;
    }
    hasSyncedRef.current = false;
  };

  const setErrorState = (message: string) => {
    setStatusMessage(message);
    setStateAndRef("error");
  };

  const extractMeta = async (
    record: Record<string, any>,
  ): Promise<SyncMeta | null> => {
    if (record.sync && record.timestamp && record.is_deleted) {
      return {
        id: record.id,
        sync: record.sync,
        timestamp: record.timestamp,
        is_deleted: record.is_deleted,
      };
    }

    const decryptedText = await Crypto.decrypt(
      record.data,
      userPassRef.current,
    );
    if (!decryptedText) {
      return null;
    }

    try {
      const info = JSON.parse(decryptedText) as Omit<SyncRecord, "id">;
      return {
        id: record.id,
        sync: info.sync,
        timestamp: info.timestamp,
        is_deleted: info.is_deleted,
      };
    } catch {
      return null;
    }
  };

  const syncDB = async () => {
    setStateAndRef("syncing");
    try {
      const ourDB = await DB.load();
      if (ourDB.length == 0 || otherDB.current.length == 0) {
        if (ourDB.length == 0 && otherDB.current.length > 0) {
          await DB.replaceAllRecords(otherDB.current);
        }
      } else {
        const ourMeta = await Promise.all(
          ourDB.map((record) => extractMeta(record)),
        );
        const otherMeta = await Promise.all(
          otherDB.current.map((record) => extractMeta(record)),
        );

        if (
          ourMeta.some((meta) => meta === null) ||
          otherMeta.some((meta) => meta === null)
        ) {
          throw new Error("Unable to decrypt or parse one or more records.");
        }

        const ourDB_meta = ourMeta as SyncMeta[];
        const otherDB_meta = otherMeta as SyncMeta[];

        const nextDB = [...ourDB];

        for (
          let otherIndex = 0;
          otherIndex < otherDB_meta.length;
          otherIndex++
        ) {
          const otherRecord = otherDB_meta[otherIndex];
          const exist_same_record = ourDB_meta.findIndex(
            (item) => item.sync === otherRecord.sync,
          );

          if (exist_same_record > -1) {
            if (
              ourDB_meta[exist_same_record].timestamp < otherRecord.timestamp
            ) {
              nextDB[exist_same_record] = otherDB.current[otherIndex];
            } else if (
              ourDB_meta[exist_same_record].is_deleted === "true" &&
              ourDB_meta[exist_same_record].is_deleted ===
                otherRecord.is_deleted
            ) {
              nextDB.splice(exist_same_record, 1);
            }
          } else {
            const found_index = ourDB_meta.findIndex(
              (item) => item.id === otherRecord.id,
            );
            if (found_index > -1) {
              if (otherRecord.timestamp > ourDB_meta[found_index].timestamp) {
                nextDB[found_index] = otherDB.current[otherIndex];
              }
            } else {
              nextDB.push(otherDB.current[otherIndex]);
            }
          }
        }

        await DB.replaceAllRecords(nextDB);
      }

      setStatusMessage(`Success sync with ${remotePeerId.current}`);
      syncDoneRef.current = true;
      setStateAndRef("connected");
    } catch {
      setErrorState(
        "Sync failed. Check that both devices use the same master password and try again.",
      );
    }
  };

  const bindConnection = (conn: any) => {
    safeDisconnectConnection();
    connectionRef.current = conn;
    hasSyncedRef.current = false;
    syncDoneRef.current = false;

    conn.on("open", async () => {
      clearConnectTimeout();
      setStateAndRef("connecting");
      try {
        remotePeerId.current = conn.peer;
        const data = await DB.load();
        conn.send({ type: "msg", data: data });
      } catch {
        setErrorState("Could not send local database to remote peer.");
      }
    });

    conn.on("data", (data: any) => {
      if (hasSyncedRef.current) {
        return;
      }
      hasSyncedRef.current = true;
      otherDB.current = Array.isArray(data?.data) ? data.data : [];
      void syncDB();
    });

    conn.on("error", () => {
      setErrorState("Connection error while syncing.");
      safeDisconnectConnection();
    });

    conn.on("close", () => {
      if (
        !syncDoneRef.current &&
        stateRef.current !== "connected" &&
        stateRef.current !== "error"
      ) {
        setErrorState("Connection closed before sync finished.");
      }
      safeDisconnectConnection();
    });
  };

  const connect = (data: string = "") => {
    if (!peer.current || !peerId) {
      setErrorState("Local peer is still initializing. Please wait a moment.");
      return;
    }

    if (data.trim() === "") {
      const input = document.getElementById("remoteId") as HTMLInputElement;
      remotePeerId.current = input.value.trim();
    } else {
      remotePeerId.current = data.trim();
    }

    if (!remotePeerId.current) {
      setErrorState("Please provide a valid remote sync ID.");
      return;
    }

    if (remotePeerId.current === peerId) {
      setErrorState("Cannot connect to your own sync ID.");
      return;
    }

    setStatusMessage("Connecting to remote peer...");
    setStateAndRef("connecting");

    const conn = peer.current.connect(remotePeerId.current, {
      reliable: true,
    });

    bindConnection(conn);
    connectTimeoutRef.current = window.setTimeout(() => {
      setErrorState("Connection timeout. Check remote sync ID and try again.");
      safeDisconnectConnection();
    }, 10000);
  };

  // Initialize PeerJS and handle connections
  useEffect(() => {
    const checkDatabase = async () => {
      const dbExists = await DB.load();
      if (dbExists.length > 0) {
        setStateAndRef("intro");
      } else {
        setStateAndRef("manage");
      }
    };

    peer.current = new Peer();

    peer.current.on("open", (id: string) => {
      setPeerId(id);
      setStatusMessage("");
    });

    peer.current.on("error", () => {
      if (stateRef.current === "connecting" || stateRef.current === "syncing") {
        setErrorState("Peer connection error. Please refresh and try again.");
      }
    });

    peer.current.on("disconnected", () => {
      if (stateRef.current === "connecting" || stateRef.current === "syncing") {
        setErrorState("Peer disconnected. Please refresh and try again.");
      }
    });

    peer.current.on("connection", (conn: any) => {
      remotePeerId.current = conn.peer;
      setStatusMessage(`Incoming connection from ${conn.peer}`);
      setStateAndRef("connecting");
      bindConnection(conn);
    });

    checkDatabase(); // Call the async function on component mount

    return () => {
      safeDisconnectConnection();
      peer.current?.destroy();
    };
  }, []);

  const page_states = {
    loading: () => {
      return <p>Loading...</p>;
    },
    intro: () => {
      return (
        <InsertPassword
          userPassRef={userPassRef}
          setState={(nextState) => {
            setStateAndRef(nextState as SyncState);
          }}
        />
      );
    },
    scan: () => {
      return (
        <>
          <button
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => setState("manage")}
          >
            Go back
          </button>
          <QrReader
            onError={(error) => {
              console.log(error);
            }}
            onScan={(result: any) => {
              if (result) {
                connect(result.data);
                setQRValue(result.data);
              }
            }}
            style={{
              width: "300px",
              height: "300px",
            }}
          />
          <p>{qr_value}</p>
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

          <h2 style={{ margin: "10px" }}>Sync ID: </h2>
          <QRCodeSVG
            value={peerId}
            size={156}
            style={{
              padding: "20px",
              backgroundColor: "white",
            }}
          />
          <p style={{ fontSize: "large", userSelect: "auto" }}>{peerId}</p>

          <button
            style={{ marginTop: "20px" }}
            onClick={() => {
              setStatusMessage("");
              setState("scan");
            }}
          >
            Scan QRcode
          </button>
          <button
            style={{ marginTop: "20px" }}
            onClick={() => {
              setStatusMessage("");
              setState("manual_input");
            }}
          >
            Other Option
          </button>
        </>
      );
    },
    manual_input: () => {
      return (
        <>
          <button
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => navigate("/")}
          >
            Go back
          </button>
          <h2 style={{ margin: "10px" }}>Sync ID: </h2>
          <p style={{ fontSize: "large", userSelect: "auto" }}>{peerId}</p>
          <input
            id="remoteId"
            type="text"
            placeholder="Insert remote sync ID"
          />
          <button
            style={{ marginTop: "20px" }}
            onClick={() => {
              connect();
            }}
          >
            Connect
          </button>
        </>
      );
    },
    connecting: () => {
      return (
        <>
          <button
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => {
              safeDisconnectConnection();
              setState("manage");
            }}
          >
            Cancel
          </button>
          <h2>Connecting...</h2>
          <p>
            {statusMessage || "Trying to establish secure peer connection."}
          </p>
        </>
      );
    },
    syncing: () => {
      return (
        <>
          <h2>Syncing...</h2>
          <p>Comparing encrypted records and applying updates.</p>
        </>
      );
    },
    connected: () => {
      return (
        <>
          <button
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => navigate("/")}
          >
            Go back
          </button>
          <h2>ID: {peerId}</h2>
          <h2>
            Success Sync with: <br /> <p>{remotePeerId.current}</p>
          </h2>
          <p>{statusMessage}</p>
          <button
            onClick={() => {
              setStatusMessage("");
              setState("manage");
            }}
          >
            Sync Again
          </button>
        </>
      );
    },
    error: () => {
      return (
        <>
          <button
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => {
              setStatusMessage("");
              setState("manage");
            }}
          >
            Go back
          </button>
          <h2>Connection Error</h2>
          <p>{statusMessage || "Unexpected sync error."}</p>
          <button
            onClick={() => {
              setStatusMessage("");
              setState("manual_input");
            }}
          >
            Retry
          </button>
        </>
      );
    },
  } satisfies Record<SyncState, () => React.ReactElement>;

  return page_states[state]();

  // return state === "intro" ? (
  //   <InsertPassword userPassRef={userPassRef} setState={setState} />
  // ) : state === "manage" ? (
  //   <>
  //     <button
  //       style={{ position: "absolute", top: "10px", left: "10px" }}
  //       onClick={() => navigate("/")}
  //     >
  //       Go back
  //     </button>
  //     <h2 style={{ margin: "10px" }}>Sync ID: </h2>
  //     <p style={{ fontSize: "large", userSelect: "auto" }}>{peerId.current}</p>
  //     <input id="remoteId" type="text" placeholder="Insert remote sync ID" />
  //     <button
  //       style={{ marginTop: "20px" }}
  //       onClick={() => {
  //         connect();
  //       }}
  //     >
  //       Connect
  //     </button>
  //   </>
  // ) : (
  //   state === "connected" && (
  //     <>
  //       <button
  //         style={{ position: "absolute", top: "10px", left: "10px" }}
  //         onClick={() => navigate("/")}
  //       >
  //         Go back
  //       </button>
  //       <h2>
  //         Connected with: <p>{remotePeerId.current}</p>
  //       </h2>
  //     </>
  //   )
  // );
}

export default SyncPass;

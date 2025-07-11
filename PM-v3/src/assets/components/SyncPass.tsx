import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import InsertPassword from "./InsertPassword";
import * as DB from "../utils/dbUtils";
import * as Crypto from "../utils/cryptoUtils";
import { QRCodeSVG } from "qrcode.react";
import QrReader from "react-web-qr-reader";

function SyncPass() {
  const [state, setState] = useState("intro");
  const [peerId, setPeerId]: any = useState(null);
  const [qr_value, setQRValue]:any = useState("")
  const remotePeerId: any = useRef(null);
  const peer: any = useRef(null);
  const userPassRef = useRef("");
  const otherDB: any = useRef([]);

  const navigate = useNavigate();

  const decryptDB = async (encrypted_db: any[]) => {
    if (encrypted_db.length == 0) {
      return [];
    }
    const decrypted = await Promise.all(
      encrypted_db.map(async (p: any) => ({
        id: p.id,
        data: await Crypto.decrypt(p.data, userPassRef.current),
      }))
    );
    const decrypt_json = decrypted.map((el) => {
      const info: {
        site: string;
        user: string;
        pass: string;
        comments: string;
        timestamp: string;
        sync: string;
        is_deleted: string;
      } = JSON.parse(el.data || "");
      return {
        id: el.id,
        site: info.site,
        user: info.user,
        pass: info.pass,
        comments: info.comments,
        timestamp: info.timestamp,
        sync: info.sync,
        is_deleted: info.is_deleted,
      };
    });
    return decrypt_json;
  };

  const connect = (data:string="") => {
    if(data===""){
      const input = document.getElementById("remoteId") as HTMLInputElement;
      remotePeerId.current = input.value;
    }
    else{
      remotePeerId.current = data;
    }
    
    const conn = peer.current.connect(remotePeerId.current);
    conn.on("open", async () => {
      console.log("Connected to peer:", remotePeerId.current);
      const data = await DB.load();
      conn.send({ type: "msg", data: data });
    });
    conn.on("data", (data: any) => {
      console.log(data);
      otherDB.current = data.data;
      syncDB();
      setState("connected");
    });
  };
  const syncDB = async () => {
    const ourDB = await DB.load();
    if (ourDB.length == 0 || otherDB.current.length == 0) {
      if (ourDB.length == 0 && otherDB.current.length > 0) {
        await DB.replaceAllRecords(otherDB.current);
      }
      //other options are not required
    } else {
      //decrypt both DB to loop through each
      const ourDB_decrypted = await decryptDB(ourDB);
      const otherDB_decrypted = await decryptDB(otherDB.current);
      const syncDB = [...ourDB];
      let otherIndex;

      for (
        otherIndex = 0;
        otherIndex < otherDB_decrypted.length;
        otherIndex++
      ) {
        const otherRecord = otherDB_decrypted[otherIndex];
        let exist_same_record = -1;
        let ourIndex;

        for (ourIndex = 0; ourIndex < ourDB_decrypted.length; ourIndex++) {
          const ourRecord = ourDB_decrypted[ourIndex];

          if (ourRecord.sync === otherRecord.sync) {
            exist_same_record = ourIndex;
            break;
          }
        }

        if (exist_same_record > -1) {
          // sync hash already exists in ourDB
          if (
            ourDB_decrypted[exist_same_record].timestamp < otherRecord.timestamp
          ) {
            // Insert your logic for replacing with the most recent here
            syncDB[exist_same_record] = otherDB.current[otherIndex];
          } else if (
            ourDB_decrypted[exist_same_record].is_deleted === "true" &&
            ourDB_decrypted[exist_same_record].is_deleted ===
              otherRecord.is_deleted
          ) {
            //same sync and timestamp and is_deleted flag is true and equal on both sides than delete
            syncDB.splice(exist_same_record, 1);
          }
        } else {
          //new record or update record
          const new_record = otherDB_decrypted[otherIndex];
          //if id already exists it must be an update record
          const found_index = ourDB_decrypted.findIndex(
            (item) => item.id === new_record.id
          );
          if (found_index > -1) {
            // need to update by the most recent
            if (new_record.timestamp > ourDB_decrypted[found_index].timestamp) {
              syncDB[found_index] = otherDB.current[otherIndex];
            } else {
              //skip because already have must recent record
            }
          } else {
            //need to add to db
            const to_add_record = otherDB.current[otherIndex];
            syncDB.push(to_add_record);
          }
        }
      }

      await DB.replaceAllRecords(syncDB);
    }
  };

  // Initialize PeerJS and handle connections
  useEffect(() => {
    const checkDatabase = async () => {
      const dbExists = await DB.load();
      if (dbExists.length > 0) {
        setState("intro");
      } else {
        setState("manage");
      }
    };

    peer.current = new Peer();

    peer.current.on("open", (id: string) => {
      setPeerId(id);
      console.log("My peer ID is: " + id);
    });

    peer.current.on("connection", (conn: any) => {
      conn.on("open", async () => {
        console.log("Incoming connection from:", conn.peer);
        remotePeerId.current = conn.peer;
        const data = await DB.load();
        conn.send({ type: "msg", data: data }); // Fixed typo here
      });
      conn.on("data", (data: any) => {
        console.log(data);
        otherDB.current = data.data;
        syncDB();
        setState("connected");
      });
    });

    checkDatabase(); // Call the async function on component mount

    return () => {
      peer.current.destroy();
    };
  }, []);

  const page_states: any = {
    loading: () => {
      return <p>Loading...</p>;
    },
    intro: () => {
      return <InsertPassword userPassRef={userPassRef} setState={setState} />;
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
            onScan={(result:any) => {
              if (result) {

                connect( result.data)
                setQRValue(result.data)
              }
            }}
            style={{
              width:"300px",
              height:"300px",
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
          <QRCodeSVG value={peerId} size={156} style={{
            padding:"20px",
            backgroundColor:"white"
          }} />
          <p style={{ fontSize: "large", userSelect: "auto" }}>{peerId}</p>

          <button
            style={{ marginTop: "20px" }}
            onClick={() => {
              // connect();
              setState("scan");
            }}
          >
            Scan QRcode
          </button>
          <button
            style={{ marginTop: "20px" }}
            onClick={() => {
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
          <button
            onClick={() => {
              setState("manage");
            }}
          >
            Sync Again
          </button>
        </>
      );
    },
  };

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

import express from "express";
import { ENV } from "./lib/env.js";

const app = express();

console.log(ENV.PORT);
console.log(ENV.DB_URL);




app.get("/", (req, res) => {
    res.status(200).json({msg:"succes from backend"});
});

app.listen(ENV.PORT, () => console.log("server is runing on 3000 port: ", ENV.PORT));

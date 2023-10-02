import express, { Application, Request, Response } from "express";
import fileRouter from "./routes/files.routes";
import path from "path";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import main from "./models/db";


dotenv.config();

declare global {
  var __basedir: string;
}

const app: Application = express();
const PORT: number = 3000;


global.__basedir = __dirname;

main()
  .then(() => {
    app.listen(PORT, (): void => {
      console.log("SERVER IS UP ON PORT:", PORT);
    });
    console.log("DB connected");
  })
  .catch(console.error);



app.use(express.json({ limit: "50mb" }));



app.get('/api/:videoName', async function (req: Request, res: Response) {
  const videoName = req.params.videoName;
  console.log({ videoName });
  res.sendFile(path.join(process.cwd(), '/src/uploads/') + videoName);
}
);

app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:5500/index.html"]
}));

app.use("/", express.static(path.join(__dirname, "uploads")));
app.use(
  "/file",
  bodyParser.raw({ type: "application/octet-stream", limit: "50mb" }),
  fileRouter
);

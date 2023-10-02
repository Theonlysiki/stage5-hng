import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import File from "../models/file";
import ffmpeg from "fluent-ffmpeg";
import { Deepgram } from "@deepgram/sdk";
// import { Writable } from "stream";
// import { log } from "console";

// let isFileReady = false;
const deepgram = new Deepgram("4cd19570bf02eea5a5fb91b3cd33f7015e6fc37a");

const getFormattedDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const formattedDate = `${year}${month}${day}`;
  return formattedDate;
};

// Define a directory for storing video chunks
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
let formattedDate: string;
let fileName: string;
let videoFilePath: string;

// Define an array to store received chunks
const chunkArray: Buffer[] = [];

// Function to receive and append video chunks
export const receiveVideoChunk = (req: Request, res: Response): void => {
  try {
    const chunk: Buffer = req.body;
    console.log({ chunk });
    formattedDate = getFormattedDate();
    fileName = `Untitled_Video_${formattedDate}.mp4`;
    

    if (!Buffer.isBuffer(chunk)) {
      // If the received data is not a Buffer, respond with a bad request status
      res.status(400).json({ message: "Invalid chunk data" });
      console.log("Invalid chunk data");
      return;
    }

    chunkArray.push(chunk);
    console.log("Chunk received and saved");

    // Send a response to acknowledge receiving the chunk
    res.status(200).json({ 
      message: "Chunk received",
      fileName
     });
  } catch (error) {
    console.error("Error receiving video chunk:", error);

    res.status(500).json({ message: "Internal server error" });
  }
};

// Function to serve the merged video file
export const saveMergedVideo = async (req: Request, res: Response) => {
  try {
    // Check if there are any received chunks
    if (chunkArray.length === 0) {
      res.status(404).json({ message: "No video chunks received" });
      console.log("No video chunks received");
      return;
    }

    // Concatenate all received chunks into a single Buffer
    const mergedBuffer: Buffer = Buffer.concat(chunkArray);

    // Write the merged buffer to a video file
    videoFilePath = path.join(uploadDir, fileName);
    fs.writeFileSync(videoFilePath, mergedBuffer);
    console.log("Merged video file saved");
    

    const getMetadata = () => {
      return new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });
    };

    // Wait for metadata retrieval
    const metadata = await getMetadata();

    // Extract relevant metadata
    const fileFormat = metadata.format.format_name;
    const Duration = metadata.format.duration;

    const upload = new File({
      file: videoFilePath,
      fileName,
      metadata: { fileFormat, Duration }
    });
    const result = await upload.save();
    console.log({ result });
    
    res.status(200).json({
      result,
      message: "File uploaded successfully",
    });

    // Clear the chunk array to prepare for the next video
    chunkArray.length = 0;
  } catch (error) {
    console.error("Error serving merged video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listFiles = async (req: Request, res: Response) => {
  try {
    const files = await File.find();
    console.log({ files });

    res.status(200).json({ files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const transcribeLocalVideo = async (req: Request, res: Response) => {
  try {
    const response = await deepgram.transcription.preRecorded(
      { url: "https://helpmeout-e2c4.onrender.com/file/" + req.params.videoName },
      { punctuate: true, utterances: true }
    );

    const srtTranscript = response.toSRT();
    console.log({ srtTranscript });
    res.status(200).json({ transcript: srtTranscript });
  } catch (error) {
    console.error("Error transcribing video:", error);
    return res.status(400).json({ message: "Error transcribing video" });
  }
};




export const fileUpload = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    console.log(req.file);

    res.status(200).json({
      message: "File uploaded successfully",
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(500).send({
          message: "File size cannot be larger than 200MB!",
        });
      }
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const fileDownload = (req: Request, res: Response) => {
  try {
    const name = req.params.fileName;

    const filePath = path.join(__dirname, "..", "uploads", name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const streamVideoFiles = async (req: Request, res: Response) => {
  try {
    const name = req.params.videoName;
    console.log({ name });

    const filePath = path.join(__dirname, "..", "uploads", name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const stat = fs.statSync(filePath);
    console.log({ stat });
    const fileSize = stat.size;
    console.log({ fileSize });

    const range = req.headers.range;
    console.log({ range });

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      console.log({ parts });
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      console.log({ chunksize });
      const file = fs.createReadStream(filePath, { start, end });
      console.log({ file });

      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, head);
      file.pipe(res);

      file.on("error", (err) => {
        console.error("Error streaming video:", err);
        res.status(500).json({ message: "Internal server error" });
      });

      // Log successful streaming
      file.on("end", () => {
        console.log("Video stream ended successfully.");
      });
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

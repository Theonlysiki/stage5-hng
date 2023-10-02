// import fs from "fs";
// import { exec } from "child_process";
// import { Deepgram } from "@deepgram/sdk";
// import ffmpegStatic from "ffmpeg-static";

// const deepgram = new Deepgram("9eedab2278a9a22f9bc1f567f520ec656ce54ab0");

// async function ffmpeg(command: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     exec(`${ffmpegStatic} ${command}`, (err, stderr, stdout) => {
//       if (err) reject(err);
//       resolve(stdout);
//     });
//   });
// }

// export async function transcribeLocalVideo(filePath: string): Promise<any> {
//   // Convert video to WAV using ffmpeg
//   ffmpeg(`-hide_banner -y -i ${filePath} ${filePath.slice(0, -4)}.wav`);

//   const audioFile = {
//     stream: fs.createReadStream(`${filePath}.wav`),
//     mimetype: "audio/wav",
//   };

//   try {
//     const response = await deepgram.transcription.preRecorded(audioFile, {
//       punctuation: true,
//       utterances: true
//     });
//     const srtTranscript = response.toSRT()
//     return srtTranscript;
//   } catch (error) {
//     console.error("Error transcribing video:", error);
//     throw error;
//   }
// }

import express from 'express';
import {  receiveVideoChunk, fileUpload, fileDownload, streamVideoFiles, saveMergedVideo, listFiles, transcribeLocalVideo  } from '../controllers/files.controllers';
import uploadFilesMiddleware from '../controllers/uploads'

const router = express.Router();

// router.post('/create', createFile)
router.post('/upload', receiveVideoChunk);
// router.post('/finish', finishFile)
router.post('/save', saveMergedVideo);
router.get('/transcribe/:videoName', transcribeLocalVideo)
router.get('/', listFiles);
// router.get('/transcribe', transcribeLocalVideo);
router.post('/', uploadFilesMiddleware, fileUpload);
router.get('/download/:fileName', fileDownload);
router.get('/:videoName', streamVideoFiles)

export default router;

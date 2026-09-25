// Transcriptions API (ujto-be). Thin re-export so services depend on one module.
export {
  createTranscription,
  createUpload,
  deleteTranscription,
  downloadTranscription,
  getTranscription,
  listTranscriptions,
  renameTranscription,
  startUpload,
  uploadToStorage,
  type UploadRequest,
} from "@/lib/api";

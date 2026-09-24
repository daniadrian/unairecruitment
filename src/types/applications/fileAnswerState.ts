// State of one file on the application form (CV or a File Upload field), as reported by the
// upload control to the form. Files are uploaded one request each before the form is sent, and
// the form only carries the ID of an uploaded file (KA-06).
export interface FileAnswerState {
    status: 'empty' | 'uploading' | 'uploaded' | 'failed'
    fileId: string | null
    fileName: string | null
}

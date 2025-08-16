import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => mimetype && mimetype.includes('pdf'),
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;

    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('📄 PDF uploaded to Vercel:', file.originalFilename);

    try {
      // Read the uploaded PDF file
      const pdfBuffer = fs.readFileSync(file.filepath);
      
      // Try to parse PDF with pdfjs-dist
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      // Configure for serverless
      pdfjs.GlobalWorkerOptions.workerSrc = null;
      
      const loadingTask = pdfjs.getDocument({ 
        data: new Uint8Array(pdfBuffer),
        verbosity: 0
      });
      
      const pdfDoc = await loadingTask.promise;
      
      let fullText = '';
      const numPages = pdfDoc.numPages;
      
      console.log(`📄 Processing ${numPages} pages in Vercel...`);
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter(item => item.str && typeof item.str === 'string')
            .map(item => item.str.trim())
            .filter(text => text.length > 0)
            .join(' ');
          
          if (pageText) {
            fullText += pageText + '\n';
          }
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${pageNum}:`, pageError.message);
        }
      }
      
      const extractedText = fullText.trim();
      
      // Clean up the uploaded file
      try {
        fs.unlinkSync(file.filepath);
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError.message);
      }
      
      if (extractedText.length === 0) {
        return res.status(200).json({
          success: true,
          filename: file.originalFilename,
          textContent: '[PDF processed but no readable text found - may be image-based PDF]',
          pages: numPages,
          textLength: 0,
          message: 'PDF processed but contained no extractable text'
        });
      }
      
      console.log('✅ PDF parsed successfully in Vercel');
      console.log('📊 Text length:', extractedText.length);
      
      return res.status(200).json({
        success: true,
        filename: file.originalFilename,
        textContent: extractedText,
        pages: numPages,
        textLength: extractedText.length,
        message: 'PDF parsed successfully'
      });
      
    } catch (pdfError) {
      console.error('❌ PDF parsing error in Vercel:', pdfError);
      
      // Clean up
      try {
        fs.unlinkSync(file.filepath);
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError.message);
      }
      
      // Return graceful fallback
      return res.status(200).json({
        success: false,
        filename: file.originalFilename,
        textContent: `[PDF upload received: ${file.originalFilename} - Text extraction not available in serverless environment]`,
        pages: 0,
        textLength: 0,
        message: 'PDF received but text extraction failed',
        error: 'PDF parsing not available in Vercel serverless environment'
      });
    }
    
  } catch (error) {
    console.error('❌ Error in PDF upload handler:', error);
    
    return res.status(500).json({ 
      error: 'Failed to process PDF upload',
      details: error.message 
    });
  }
}

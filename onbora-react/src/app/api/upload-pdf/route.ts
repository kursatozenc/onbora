import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    console.log('📄 PDF received:', file.name, 'size:', file.size);

    try {
      // Convert File to ArrayBuffer for pdfjs
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Dynamic import pdfjs-dist for serverless compatibility
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as string);

      // Disable worker for serverless environment
      (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: null } }).GlobalWorkerOptions.workerSrc = null;

      const loadingTask = (pdfjs as unknown as {
        getDocument: (opts: { data: Uint8Array; verbosity: number }) => { promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str: string }>;
            }>;
          }>;
        }> };
      }).getDocument({
        data: uint8Array,
        verbosity: 0,
      });

      const pdfDoc = await loadingTask.promise;
      let fullText = '';
      const numPages = pdfDoc.numPages;

      console.log(`📄 Processing ${numPages} pages...`);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item) => item.str && typeof item.str === 'string')
            .map((item) => item.str.trim())
            .filter((text) => text.length > 0)
            .join(' ');

          if (pageText) fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${pageNum}:`, pageError);
        }
      }

      const extractedText = fullText.trim();

      if (extractedText.length === 0) {
        return NextResponse.json({
          success: true,
          filename: file.name,
          textContent: '[PDF processed but no readable text found — may be image-based PDF]',
          pages: numPages,
          textLength: 0,
          message: 'PDF processed but contained no extractable text',
        });
      }

      console.log('✅ PDF parsed successfully, text length:', extractedText.length);

      return NextResponse.json({
        success: true,
        filename: file.name,
        textContent: extractedText,
        pages: numPages,
        textLength: extractedText.length,
        message: 'PDF parsed successfully',
      });
    } catch (pdfError) {
      console.error('❌ PDF parsing error:', pdfError);

      // Graceful fallback — file received but text extraction failed
      return NextResponse.json({
        success: false,
        filename: file.name,
        textContent: `[PDF uploaded: ${file.name} — text extraction failed. The document was received but could not be parsed. Please try a text-based PDF.]`,
        pages: 0,
        textLength: 0,
        message: 'PDF received but text extraction failed',
      });
    }
  } catch (error) {
    console.error('❌ Error in PDF upload handler:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF upload', details: String(error) },
      { status: 500 }
    );
  }
}

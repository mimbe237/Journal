
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log('Sharp version:', require('sharp/package.json').version);
  try {
    // Create a minimal PDF file (this is a valid empty PDF structure)
    const pdfContent = `%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
173
%%EOF`;
    
    const pdfPath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(pdfPath, pdfContent);
    
    console.log('Created test PDF at', pdfPath);

    const metadata = await sharp(pdfPath).metadata();
    console.log('Metadata:', metadata);
    
    if (metadata.format === 'pdf') {
        console.log('SUCCESS: Sharp supports PDF');
    } else {
        console.log('WARNING: Sharp did not identify as PDF, but:', metadata.format);
    }

    fs.unlinkSync(pdfPath);

  } catch (err) {
    console.error('FAILURE:', err.message);
  }
}

test();

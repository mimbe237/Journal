
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const pdfContent = `%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 100 100]>>endobj
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

const pdfPath = path.join(__dirname, 'test_sips.pdf');
const outPath = path.join(__dirname, 'test_sips.png');

fs.writeFileSync(pdfPath, pdfContent);

exec(`sips -s format png "${pdfPath}" --out "${outPath}"`, (err, stdout, stderr) => {
    if (err) {
        console.error('Error:', err);
        console.error('Stderr:', stderr);
    } else {
        console.log('Success:', stdout);
        if (fs.existsSync(outPath)) {
            console.log('Output file created.');
            fs.unlinkSync(outPath);
        }
    }
    fs.unlinkSync(pdfPath);
});

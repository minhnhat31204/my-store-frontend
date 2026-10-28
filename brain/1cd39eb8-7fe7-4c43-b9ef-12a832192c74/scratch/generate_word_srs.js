const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
} = require('docx');

async function buildWordDoc() {
  const mdContent = fs.readFileSync('D:\\my-store-frontend\\TAI_LIEU_SRS_DEVORA_v2.1.md', 'utf8');
  const lines = mdContent.split(/\r?\n/);

  const docChildren = [];

  // Tiêu đề trang bìa
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG',
          bold: true,
          size: 24, // 12pt
          color: '333333',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'KHOA CÔNG NGHỆ PHẦN MỀM - BỘ MÔN CÔNG NGHỆ PHẦN MỀM NÂNG CAO',
          bold: true,
          size: 24,
          color: '333333',
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM',
          bold: true,
          size: 36, // 18pt
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'SOFTWARE REQUIREMENTS SPECIFICATION (SRS)',
          bold: true,
          size: 28, // 14pt
          color: '2563EB',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN MÁY TÍNH & LINH KIỆN CÔNG NGHỆ DEVORA',
          bold: true,
          size: 26,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'RESTful Backend API (Node.js/Express) + Web Client & Admin (Next.js) + Mobile App (Flutter)',
          italics: true,
          size: 22,
          color: '64748B',
        }),
      ],
      spacing: { after: 500 },
    })
  );

  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Bỏ qua các dòng tiêu đề đầu đã render trang bìa
    if (i < 10 && (line.startsWith('TRƯỜNG') || line.startsWith('KHOA') || line.startsWith('TÀI LIỆU') || line.startsWith('SOFTWARE') || line.startsWith('HỆ THỐNG'))) {
      continue;
    }

    // Xử lý bảng Markdown (| a | b |)
    if (line.startsWith('|') && line.endsWith('|')) {
      // Dòng phân cách header |--|--|
      if (/^\|[\s:-|-]+\|$/.test(line)) {
        continue;
      }
      inTable = true;
      const rawCols = line.split('|').slice(1, -1).map(c => c.trim().replace(/<br>/g, '\n'));
      tableRows.push(rawCols);
      continue;
    } else if (inTable) {
      // Kết thúc bảng, render Table vào Word
      inTable = false;
      if (tableRows.length > 0) {
        const docTableRows = tableRows.map((rowCols, rIdx) => {
          return new TableRow({
            tableHeader: rIdx === 0,
            children: rowCols.map(cellText => {
              const isHeader = rIdx === 0;
              return new TableCell({
                width: { size: Math.floor(9000 / rowCols.length), type: WidthType.DXA },
                shading: isHeader ? { fill: '0F172A' } : (rIdx % 2 === 0 ? { fill: 'F8FAFC' } : { fill: 'FFFFFF' }),
                margins: { top: 120, bottom: 120, left: 150, right: 150 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: isHeader || cellText.startsWith('**'),
                        color: isHeader ? 'FFFFFF' : '1E293B',
                        size: isHeader ? 21 : 20, // 10-10.5pt
                      }),
                    ],
                  }),
                ],
              });
            }),
          });
        });

        docChildren.push(
          new Table({
            rows: docTableRows,
            alignment: AlignmentType.CENTER,
            width: { size: 9500, type: WidthType.DXA },
          }),
          new Paragraph({ spacing: { after: 250 } })
        );
        tableRows = [];
      }
    }

    if (!line) {
      continue;
    }

    // Xử lý Heading
    if (line.startsWith('## ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: line.replace('## ', ''),
              bold: true,
              size: 28, // 14pt
              color: '1E3A8A', // Blue-900
            }),
          ],
          spacing: { before: 350, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: line.replace('### ', ''),
              bold: true,
              size: 25, // 12.5pt
              color: '2563EB', // Blue-600
            }),
          ],
          spacing: { before: 250, after: 120 },
        })
      );
    } else if (line.startsWith('#### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: line.replace('#### ', ''),
              bold: true,
              size: 23,
              color: '0F172A',
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Danh sách gạch đầu dòng
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: line.replace(/^[-*]\s+/, ''),
              size: 22,
              color: '334155',
            }),
          ],
          spacing: { after: 80 },
        })
      );
    } else if (line.startsWith('```')) {
      // Code block hoặc sơ đồ ASCII
      continue;
    } else {
      // Đoạn văn bản thông thường
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 22,
              color: '334155',
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (2.54 cm)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = 'D:\\my-store-frontend\\TAI_LIEU_SRS_DEVORA_v2.1.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully created Word document at:', outPath);
}

buildWordDoc().catch(console.error);

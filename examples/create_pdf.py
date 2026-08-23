import zlib

def make_pdf(filename):
    # Professional layout text for invoice
    lines = [
        ("INVOICE", 50, 750, 24, "Helvetica-Bold"),
        ("Invoice Number: INV-2026-0901", 50, 715, 12, "Helvetica-Bold"),
        ("Invoice Date: 2026-09-01", 50, 700, 10, "Helvetica"),
        ("Due Date: 2026-10-01", 50, 685, 10, "Helvetica"),
        ("Currency: EUR", 50, 670, 10, "Helvetica"),
        
        ("SELLER:", 50, 635, 12, "Helvetica-Bold"),
        ("Global Cloud Services SAS", 50, 620, 10, "Helvetica"),
        ("VAT ID: FR98765432101", 50, 605, 10, "Helvetica"),
        ("Address: 24 Rue de Rivoli, 75004 Paris, France", 50, 590, 10, "Helvetica"),
        
        ("BUYER:", 320, 635, 12, "Helvetica-Bold"),
        ("Nordic Retail Solutions AB", 320, 620, 10, "Helvetica"),
        ("VAT ID: SE556012345601", 320, 605, 10, "Helvetica"),
        ("Address: Kungsgatan 12, 111 35 Stockholm, Sweden", 320, 590, 10, "Helvetica"),
        
        ("--------------------------------------------------------------------------------------------------------------------------------", 50, 560, 10, "Helvetica"),
        ("ITEM / DESCRIPTION", 50, 545, 10, "Helvetica-Bold"),
        ("QTY", 320, 545, 10, "Helvetica-Bold"),
        ("UNIT PRICE", 400, 545, 10, "Helvetica-Bold"),
        ("AMOUNT", 490, 545, 10, "Helvetica-Bold"),
        ("--------------------------------------------------------------------------------------------------------------------------------", 50, 535, 10, "Helvetica"),
        
        ("1. Cloud Compute Cluster Enterprise", 50, 515, 10, "Helvetica"),
        ("2", 325, 515, 10, "Helvetica"),
        ("EUR 850.00", 400, 515, 10, "Helvetica"),
        ("EUR 1,700.00", 490, 515, 10, "Helvetica"),
        
        ("2. Database Backup & Disaster Recovery", 50, 490, 10, "Helvetica"),
        ("1", 325, 490, 10, "Helvetica"),
        ("EUR 350.00", 400, 490, 10, "Helvetica"),
        ("EUR 350.00", 490, 490, 10, "Helvetica"),
        
        ("3. Dedicated Engineering SLA (24/7)", 50, 465, 10, "Helvetica"),
        ("1", 325, 465, 10, "Helvetica"),
        ("EUR 500.00", 400, 465, 10, "Helvetica"),
        ("EUR 500.00", 490, 465, 10, "Helvetica"),
        
        ("--------------------------------------------------------------------------------------------------------------------------------", 50, 440, 10, "Helvetica"),
        ("Line Total (Excl. Tax):", 350, 415, 10, "Helvetica"),
        ("EUR 2,550.00", 490, 415, 10, "Helvetica"),
        
        ("Tax Amount (VAT 20%):", 350, 395, 10, "Helvetica"),
        ("EUR 510.00", 490, 395, 10, "Helvetica"),
        
        ("TOTAL DUE (Inc. Tax):", 350, 370, 12, "Helvetica-Bold"),
        ("EUR 3,060.00", 490, 370, 12, "Helvetica-Bold"),
        
        ("Payment Terms: Net 30 days via SEPA Bank Transfer", 50, 320, 10, "Helvetica"),
        ("IBAN: FR7630004000019876543210145 | BIC: BNPAFRPP", 50, 305, 10, "Helvetica"),
        ("Thank you for your business!", 50, 270, 10, "Helvetica-Oblique"),
    ]

    stream_content = "BT\n"
    for text, x, y, size, font in lines:
        font_tag = "/F1" if "Bold" not in font and "Oblique" not in font else ("/F2" if "Bold" in font else "/F3")
        stream_content += f"{font_tag} {size} Tf\n1 0 0 1 {x} {y} Tm\n({text}) Tj\n"
    stream_content += "ET\n"
    
    stream_bytes = stream_content.encode('latin1')
    
    objects = []
    
    # 1: Catalog
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    # 3: Page
    objects.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>")
    # 4: Stream
    objects.append(f"<< /Length {len(stream_bytes)} >>\nstream\n".encode('latin1') + stream_bytes + b"\nendstream")
    # 5: Font F1 (Helvetica)
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    # 6: Font F2 (Helvetica-Bold)
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    # 7: Font F3 (Helvetica-Oblique)
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>")
    
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = []
    
    for i, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{i} 0 obj\n".encode('latin1'))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
        
    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode('latin1'))
    for off in offsets:
        pdf.extend(f"{off:010d} 00000 n \n".encode('latin1'))
        
    pdf.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('latin1'))
    
    with open(filename, 'wb') as f:
        f.write(pdf)

if __name__ == "__main__":
    make_pdf("examples/sample-invoice.pdf")
    print("Created examples/sample-invoice.pdf")

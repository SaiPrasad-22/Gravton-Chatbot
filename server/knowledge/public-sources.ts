// Customer-facing titles for the knowledge-centre documents, keyed by the document file name used in sources.json.
// They are shown ONLY when a customer explicitly asks where an answer comes from. Use the public title of the document, never a file name,
// page number or internal label. Add a line here when a new document is added to the knowledge centre.
export const PUBLIC_SOURCE_LABELS: Record<string, string> = {
  'Product-Booklet.pdf': 'the Gravton Quanta product booklet',
  'Bifold-Brohure.pdf': 'the Gravton Quanta brochure',
  'Start-up-Guide-Quanta.pdf': 'the Quanta Start-up Guide',
  'User-Manual-Quanta-S+.pdf': 'the Quanta S+ User Manual',
  'Gravton Info.docx': 'Gravton’s official product information',
};

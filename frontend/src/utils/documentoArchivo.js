export const EXTENSIONES_DOCUMENTO = ['.docx', '.pdf', '.xlsx', '.pptx', '.txt', '.md']
export const DOCUMENTO_ACCEPT = EXTENSIONES_DOCUMENTO.join(',')
export const DOCUMENTO_MAX_BYTES = 30 * 1024 * 1024

export function validarArchivoDocumento(archivo) {
  const extension = `.${archivo.name.split('.').pop()?.toLowerCase() || ''}`
  if (!EXTENSIONES_DOCUMENTO.includes(extension)) {
    return 'Solo se admiten documentos Word (.docx), PDF, Excel (.xlsx), PowerPoint (.pptx), Bloc de notas (.txt) o Markdown (.md).'
  }
  if (archivo.size > DOCUMENTO_MAX_BYTES) return 'El archivo supera el límite de 30MB permitido.'
  return null
}

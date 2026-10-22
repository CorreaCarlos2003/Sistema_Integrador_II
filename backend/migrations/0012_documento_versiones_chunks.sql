ALTER TABLE documento_versiones
    ADD COLUMN chunks_indexados INT NOT NULL DEFAULT 0;

UPDATE documento_versiones AS version
SET chunks_indexados = documento.chunks_indexados
FROM documentos AS documento
WHERE version.documento_id = documento.id
  AND version.vigente = TRUE;

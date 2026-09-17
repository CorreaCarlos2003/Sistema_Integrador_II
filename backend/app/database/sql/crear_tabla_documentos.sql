-- Ejecutar manualmente en la base de datos (no hay migraciones automáticas en el proyecto).
CREATE TABLE documentos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre NVARCHAR(255) NOT NULL,
    ruta_archivo NVARCHAR(500) NOT NULL,
    chunks_indexados INT NOT NULL DEFAULT 0,
    fecha_subida DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_documentos_proyectos FOREIGN KEY (proyecto_id)
        REFERENCES proyectos(id) ON DELETE CASCADE
);

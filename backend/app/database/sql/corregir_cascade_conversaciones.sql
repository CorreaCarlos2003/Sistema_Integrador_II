-- Ejecutar manualmente en la base de datos (no hay migraciones automáticas en el proyecto).
-- FK_Conversaciones_Proyecto estaba como NO_ACTION, a diferencia de documentos y
-- usuarios_proyectos (CASCADE). Esto impedía eliminar cualquier proyecto que ya
-- tuviera registros en conversaciones (SQL Server rechazaba el DELETE por violación
-- de llave foránea).
ALTER TABLE conversaciones DROP CONSTRAINT FK_Conversaciones_Proyecto;

ALTER TABLE conversaciones
    ADD CONSTRAINT FK_Conversaciones_Proyecto FOREIGN KEY (proyecto_id)
        REFERENCES proyectos(id) ON DELETE CASCADE;

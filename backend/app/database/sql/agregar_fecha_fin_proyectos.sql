-- Ejecutar manualmente en la base de datos (no hay migraciones automáticas en el proyecto).
ALTER TABLE proyectos
    ADD fecha_fin DATE NULL;

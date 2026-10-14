ALTER TABLE proyectos
    ADD COLUMN fecha_ultima_actividad TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE proyectos SET fecha_ultima_actividad = fecha_creacion;

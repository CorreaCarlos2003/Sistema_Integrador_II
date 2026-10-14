CREATE TABLE permisos_proyecto (
    usuario_id INT NOT NULL,
    proyecto_id INT NOT NULL,
    ver BOOLEAN NOT NULL DEFAULT TRUE,
    subir_crear BOOLEAN NOT NULL DEFAULT FALSE,
    editar_anotar BOOLEAN NOT NULL DEFAULT FALSE,
    descargar BOOLEAN NOT NULL DEFAULT FALSE,
    consulta_ia BOOLEAN NOT NULL DEFAULT FALSE,
    nota VARCHAR(150),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, proyecto_id),
    CONSTRAINT fk_permisos_proyecto_up FOREIGN KEY (usuario_id, proyecto_id)
        REFERENCES usuarios_proyectos (usuario_id, proyecto_id) ON DELETE CASCADE
);

-- Valores por defecto para los miembros que ya existen en cada proyecto:
-- el responsable queda con acceso total y los demás con acceso estándar de colaborador.
INSERT INTO permisos_proyecto (usuario_id, proyecto_id, ver, subir_crear, editar_anotar, descargar, consulta_ia, nota)
SELECT
    usuario_id,
    proyecto_id,
    TRUE,
    (rol_proyecto = 'RESPONSABLE'),
    (rol_proyecto = 'RESPONSABLE'),
    TRUE,
    TRUE,
    CASE WHEN rol_proyecto = 'RESPONSABLE' THEN 'Acceso total a expedientes' ELSE 'Acceso estándar de colaborador' END
FROM usuarios_proyectos
WHERE estado_invitacion = 'ACEPTADA';

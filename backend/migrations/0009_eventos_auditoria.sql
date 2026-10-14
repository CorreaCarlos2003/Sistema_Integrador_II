CREATE TABLE eventos_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    actor_nombre VARCHAR(255) NOT NULL,
    actor_rol VARCHAR(50),
    modulo VARCHAR(50) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'info',
    descripcion VARCHAR(500) NOT NULL,
    referencia VARCHAR(150),
    proyecto_id INT REFERENCES proyectos(id) ON DELETE SET NULL,
    duracion_ms INT,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eventos_auditoria_fecha ON eventos_auditoria (fecha DESC);
CREATE INDEX idx_eventos_auditoria_modulo ON eventos_auditoria (modulo);
CREATE INDEX idx_eventos_auditoria_usuario ON eventos_auditoria (usuario_id);

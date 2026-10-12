-- Complementa las tablas de conversaciones y mensajes de la migración inicial.
ALTER TABLE conversaciones ADD COLUMN titulo VARCHAR(255) NOT NULL DEFAULT 'Nueva conversación';
ALTER TABLE mensajes ADD COLUMN tipo VARCHAR(30) NOT NULL DEFAULT 'chat';
ALTER TABLE mensajes ADD COLUMN metadatos JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX idx_conversaciones_usuario_proyecto_fecha
    ON conversaciones (usuario_id, proyecto_id, fecha DESC);
CREATE INDEX idx_mensajes_conversacion_id
    ON mensajes (conversacion_id, id);

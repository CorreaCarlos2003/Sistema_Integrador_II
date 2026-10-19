-- Extiende las tablas existentes; conserva las conversaciones y mensajes previos.
ALTER TABLE conversaciones ADD COLUMN titulo VARCHAR(255) NOT NULL DEFAULT 'Nueva conversación';
ALTER TABLE conversaciones ADD COLUMN titulo_manual INTEGER NOT NULL DEFAULT 0;
ALTER TABLE conversaciones ADD COLUMN resumen_contexto TEXT NOT NULL DEFAULT '';
ALTER TABLE conversaciones ADD COLUMN fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE conversaciones ADD COLUMN fecha_archivado TIMESTAMP;

ALTER TABLE mensajes ADD COLUMN tipo VARCHAR(30) NOT NULL DEFAULT 'chat';
ALTER TABLE mensajes ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'completado';
ALTER TABLE mensajes ADD COLUMN mensaje_origen_id INT REFERENCES mensajes(id) ON DELETE SET NULL;
ALTER TABLE mensajes ADD COLUMN codigo_error VARCHAR(80);
ALTER TABLE mensajes ADD COLUMN detalle_error VARCHAR(500);
ALTER TABLE mensajes ADD COLUMN documento_ids VARCHAR(500);

CREATE TABLE citas_mensaje (
    id SERIAL PRIMARY KEY,
    mensaje_id INT NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
    numero INT NOT NULL,
    chunk_id VARCHAR(100),
    documento_id INT,
    documento_nombre VARCHAR(255) NOT NULL,
    version_id INT,
    version_numero VARCHAR(50),
    pagina INT,
    seccion VARCHAR(255),
    extracto TEXT NOT NULL,
    UNIQUE (mensaje_id, numero)
);

CREATE TABLE ejecuciones_ia (
    id SERIAL PRIMARY KEY,
    mensaje_usuario_id INT NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
    mensaje_asistente_id INT REFERENCES mensajes(id) ON DELETE SET NULL,
    proveedor VARCHAR(30) NOT NULL DEFAULT 'groq',
    modelo VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    chunks_recuperados INT NOT NULL DEFAULT 0,
    tokens_entrada INT,
    tokens_salida INT,
    duracion_recuperacion_ms INT,
    duracion_generacion_ms INT,
    duracion_total_ms INT,
    fuentes VARCHAR(500),
    codigo_error VARCHAR(80),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cada documento existente es, por ahora, una versión 1. El feature de fuentes
-- podrá agregar versiones posteriores sin cambiar el contrato del chatbot.
CREATE TABLE documento_versiones (
    id SERIAL PRIMARY KEY,
    documento_id INT NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (documento_id, numero)
);
INSERT INTO documento_versiones (documento_id, numero, nombre, ruta_archivo, vigente, fecha)
SELECT id, '1', nombre, ruta_archivo, TRUE, fecha_subida FROM documentos;

CREATE INDEX idx_conversaciones_propietario ON conversaciones(usuario_id, proyecto_id, fecha_actualizacion DESC);
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id, id);
CREATE INDEX idx_versiones_vigentes ON documento_versiones(documento_id, vigente);
CREATE UNIQUE INDEX uq_version_vigente ON documento_versiones(documento_id) WHERE vigente = TRUE;
CREATE INDEX idx_ejecuciones_mensaje ON ejecuciones_ia(mensaje_usuario_id);

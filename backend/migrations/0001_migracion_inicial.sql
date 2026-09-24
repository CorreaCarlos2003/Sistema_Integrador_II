-- 1. Creación de Tablas Principales
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contraseña_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'Usuario' CHECK (rol IN ('Administrador', 'Usuario')),
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'Por iniciar' CHECK (estado IN ('Por iniciar', 'En proceso', 'Postergado', 'Finalizado')),
    archivado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Creación de Tablas de Detalle y Relación (Proyectos)
CREATE TABLE proyecto_detalle (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    fecha_inicio TIMESTAMP,
    fecha_fin DATE,
    fecha_real_fin TIMESTAMP,
    CONSTRAINT fk_detalle_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE usuarios_proyectos (
    usuario_id INT NOT NULL,
    proyecto_id INT NOT NULL,
    rol_proyecto VARCHAR(50) NOT NULL DEFAULT 'MIEMBRO' CHECK (rol_proyecto IN ('RESPONSABLE', 'MIEMBRO')),
    cargo VARCHAR(100),
    PRIMARY KEY (usuario_id, proyecto_id),
    CONSTRAINT fk_up_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_up_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE proyecto_postergaciones (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    motivo TEXT NOT NULL,
    fecha_pausa TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_retorno_estimada DATE,
    fecha_reactivacion TIMESTAMP,
    CONSTRAINT fk_postergacion_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    chunks_indexados INT NOT NULL DEFAULT 0,
    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documentos_proyectos FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- 3. Creación de Tablas del Sistema de Comunicación y Auditoría
CREATE TABLE conversaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    proyecto_id INT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversacion_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INT NOT NULL,
    rol VARCHAR(50) NOT NULL,
    contenido TEXT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensaje_conversacion FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
);

CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT,
    acción VARCHAR(255) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalle TEXT,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
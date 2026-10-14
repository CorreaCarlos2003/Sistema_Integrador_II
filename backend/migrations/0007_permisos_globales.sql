CREATE TABLE permisos_globales (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    asignado BOOLEAN NOT NULL DEFAULT TRUE,
    ver BOOLEAN NOT NULL DEFAULT TRUE,
    crear BOOLEAN NOT NULL DEFAULT FALSE,
    editar BOOLEAN NOT NULL DEFAULT FALSE,
    eliminar BOOLEAN NOT NULL DEFAULT FALSE,
    nota VARCHAR(150),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permiso_global UNIQUE (rol, modulo),
    CONSTRAINT permisos_globales_rol_check CHECK (rol IN ('Jefe de Proyecto', 'Colaborador')),
    CONSTRAINT permisos_globales_modulo_check
        CHECK (modulo IN ('inicio', 'proyectos', 'usuarios', 'roles', 'historial', 'reportes'))
);

-- Valores por defecto: Jefe de Proyecto
INSERT INTO permisos_globales (rol, modulo, asignado, ver, crear, editar, eliminar, nota) VALUES
    ('Jefe de Proyecto', 'inicio',    TRUE,  TRUE,  FALSE, FALSE, FALSE, 'Solo lectura'),
    ('Jefe de Proyecto', 'proyectos', TRUE,  TRUE,  TRUE,  TRUE,  FALSE, 'Edición y gestión habilitada'),
    ('Jefe de Proyecto', 'usuarios',  TRUE,  TRUE,  FALSE, FALSE, FALSE, 'Solo consulta'),
    ('Jefe de Proyecto', 'roles',     TRUE,  TRUE,  FALSE, FALSE, FALSE, 'Solo consulta'),
    ('Jefe de Proyecto', 'historial', TRUE,  TRUE,  FALSE, FALSE, FALSE, 'Solo consulta'),
    ('Jefe de Proyecto', 'reportes',  FALSE, FALSE, FALSE, FALSE, FALSE, 'Módulo no asignado a este rol');

-- Valores por defecto: Colaborador
INSERT INTO permisos_globales (rol, modulo, asignado, ver, crear, editar, eliminar, nota) VALUES
    ('Colaborador', 'inicio',    TRUE,  TRUE,  FALSE, FALSE, FALSE, 'Solo lectura'),
    ('Colaborador', 'proyectos', TRUE,  TRUE,  FALSE, FALSE, FALSE, 'Solo consulta de proyectos asignados'),
    ('Colaborador', 'usuarios',  FALSE, FALSE, FALSE, FALSE, FALSE, 'Módulo no asignado a este rol'),
    ('Colaborador', 'roles',     FALSE, FALSE, FALSE, FALSE, FALSE, 'Módulo no asignado a este rol'),
    ('Colaborador', 'historial', FALSE, FALSE, FALSE, FALSE, FALSE, 'Módulo no asignado a este rol'),
    ('Colaborador', 'reportes',  FALSE, FALSE, FALSE, FALSE, FALSE, 'Módulo no asignado a este rol');

ALTER TABLE usuarios_proyectos
    ADD COLUMN estado_invitacion VARCHAR(20) NOT NULL DEFAULT 'ACEPTADA';

ALTER TABLE usuarios_proyectos
    ADD CONSTRAINT usuarios_proyectos_estado_invitacion_check
    CHECK (estado_invitacion IN ('PENDIENTE', 'ACEPTADA'));

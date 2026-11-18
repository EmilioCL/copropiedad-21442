-- Grupo de Julián/Ignacio: el administrador también debe poder proponer un convenio
-- (hoy lo celebraba directo, sin paso de comité). Se agrega el nuevo origen en su
-- propia migración porque un nuevo valor de enum no puede usarse en la misma
-- transacción en la que se agrega.
alter type propuesta_origen_t add value if not exists 'Administrador';

-- Instrucción del profesor: quitar el nombre/marca "Residencia / Parque Los
-- Almendros" y dejar el software neutro (el producto ya se llama "Copropiedad
-- 21442" en la interfaz; aquí se renombra el condominio de demostración ya
-- sembrado en la base de datos para que no quede ningún rastro del nombre).
update condominios set nombre = 'Condominio Demo' where nombre = 'Parque Los Almendros';

# Database Structure Guide

## ℹ️ IMPORTANTE: NO SE REQUIERE MIGRACIÓN

Este bot ha sido actualizado para mejorar la claridad entre conceptos:

- **Base de Datos**: Usa "curso" (como siempre lo ha hecho)
- **Canales de Discord**: Se organizan por "niveles"

**No necesitas hacer cambios en tu base de datos.** Las columnas permanecen como `curso` en las tablas `coins` y `activities`.

## Estructura Actual de Base de Datos

Tu base de datos debe tener la siguiente estructura (sin cambios):

### Tabla `coins`
```sql
CREATE TABLE public.coins (
  userId text NOT NULL UNIQUE,
  amount bigint NOT NULL DEFAULT '0'::bigint,
  username text,
  curso curso_enum,
  CONSTRAINT coins_pkey PRIMARY KEY (userId)
);
```

### Tabla `activities`
```sql
CREATE TABLE public.activities (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  teacher text,
  curso curso_enum,
  threadId text,
  CONSTRAINT activities_pkey PRIMARY KEY (uuid)
);
```

### Tipo Enum
```sql
CREATE TYPE curso_enum AS ENUM ('1E1', '1E2', '2E1', '2E2', '3E1', '3E2');
```

## Conceptos Clave

### "Curso" (Base de Datos)
- Almacenado en la columna `curso` en las tablas
- Valores: 1E1, 1E2, 2E1, 2E2, 3E1, 3E2
- Representa la clasificación académica del estudiante

### "Nivel" (Discord UI)
- Término usado en la interfaz de Discord
- Se refiere a la organización de canales por niveles
- Mismo valor que "curso" pero diferente contexto de uso

## Ejemplo de Uso

Cuando un profesor crea una actividad:
1. Selecciona el **nivel** en Discord (1E1, 1E2, etc.)
2. El bot guarda ese valor en la columna **curso** de la base de datos
3. Los usuarios ven "Nivel: 1E1" en los embeds de Discord
4. La base de datos almacena `curso = '1E1'`

## Verificación

Si quieres verificar que tu base de datos está correcta, ejecuta:

```sql
-- Verificar estructura de tabla coins
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coins';

-- Deberías ver una columna llamada 'curso', NO 'nivel'
```

## Soporte

Si tu base de datos tiene columnas llamadas `nivel` en lugar de `curso`, puedes renombrarlas de vuelta:

```sql
-- Solo si accidentalmente renombraste las columnas
ALTER TABLE coins RENAME COLUMN nivel TO curso;
ALTER TABLE activities RENAME COLUMN nivel TO curso;
ALTER TYPE nivel_enum RENAME TO curso_enum;
```

# Database Migration Guide: curso → nivel

## ⚠️ IMPORTANTE: Migración de Base de Datos Requerida

Este bot ha sido actualizado para usar la terminología "nivel" en lugar de "curso". 
Necesitarás ejecutar los siguientes comandos SQL en tu base de datos Supabase para actualizar las columnas.

## Pasos para Migrar

### 1. Respaldar tus datos (recomendado)
```sql
-- Crear respaldo de la tabla coins
CREATE TABLE coins_backup AS SELECT * FROM coins;

-- Crear respaldo de la tabla activities
CREATE TABLE activities_backup AS SELECT * FROM activities;
```

### 2. Renombrar las columnas
```sql
-- Renombrar columna en tabla coins
ALTER TABLE coins RENAME COLUMN curso TO nivel;

-- Renombrar columna en tabla activities  
ALTER TABLE activities RENAME COLUMN curso TO nivel;
```

### 3. Actualizar el tipo enum (si existe)
```sql
-- Si creaste el tipo enum curso_enum, renómbralo
ALTER TYPE curso_enum RENAME TO nivel_enum;
```

### 4. Verificar los cambios
```sql
-- Verificar estructura de tabla coins
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coins';

-- Verificar estructura de tabla activities
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities';
```

## Alternativa: Crear Tablas Nuevas (Si prefieres empezar de cero)

Si prefieres crear las tablas desde cero con la nueva nomenclatura:

```sql
-- Eliminar tablas antiguas (¡CUIDADO! Esto borrará todos los datos)
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS coins;
DROP TYPE IF EXISTS curso_enum;

-- Crear tipo enum para niveles
CREATE TYPE nivel_enum AS ENUM ('1E1', '1E2', '2E1', '2E2', '3E1', '3E2');

-- Crear tabla de monedas con nivel
CREATE TABLE public.coins (
  userId text NOT NULL UNIQUE,
  amount bigint NOT NULL DEFAULT '0'::bigint,
  username text,
  nivel nivel_enum,
  CONSTRAINT coins_pkey PRIMARY KEY (userId)
);

-- Crear tabla de actividades con nivel
CREATE TABLE public.activities (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  teacher text,
  nivel nivel_enum,
  threadId text,
  CONSTRAINT activities_pkey PRIMARY KEY (uuid)
);

-- Habilitar Row Level Security (opcional pero recomendado)
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso (ajusta según tus necesidades)
CREATE POLICY "Enable read access for all users" ON coins FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON coins FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON coins FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON activities FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON activities FOR INSERT WITH CHECK (true);
```

## Notas Adicionales

- La migración solo afecta los nombres de las columnas, no los valores de datos
- Los valores ('1E1', '1E2', '2E1', '2E2', '3E1', '3E2') permanecen iguales
- El bot ahora se refiere a estos valores como "niveles" en lugar de "cursos"
- Asegúrate de realizar esta migración ANTES de usar el bot actualizado

## Verificación Post-Migración

Después de ejecutar la migración, verifica que todo funcione correctamente:

1. Inicia el bot y verifica que no haya errores en la consola
2. Prueba el comando `/coins get` para verificar que muestra tu nivel
3. Crea una actividad o subasta para verificar que la selección de nivel funciona
4. Revisa el canal de registro (TEACHER_CHANNEL_ID) para ver que los logs muestran el nivel correcto

## Soporte

Si encuentras problemas durante la migración, revisa:
- Los logs de Supabase para errores de SQL
- La consola del bot para mensajes de error
- Asegúrate de que todas las variables de entorno estén correctamente configuradas

## Rollback (En caso de problemas)

Si necesitas revertir los cambios:

```sql
-- Restaurar desde respaldo
DROP TABLE IF EXISTS coins;
DROP TABLE IF EXISTS activities;

-- Renombrar las tablas de respaldo
ALTER TABLE coins_backup RENAME TO coins;
ALTER TABLE activities_backup RENAME TO activities;

-- Renombrar el enum de vuelta
ALTER TYPE nivel_enum RENAME TO curso_enum;
```

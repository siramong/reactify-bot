# Guía de Configuración del Sistema de Casas

Esta guía te ayudará a configurar completamente el Sistema de Casas en tu bot de Discord.

## 📋 Índice

1. [Configuración de Base de Datos](#configuración-de-base-de-datos)
2. [Crear las Casas](#crear-las-casas)
3. [Asignar Roles](#asignar-roles)
4. [Sistema de Recompensas](#sistema-de-recompensas)
5. [Programa de Mentores](#programa-de-mentores)
6. [Gestión de Discord](#gestión-de-discord)

## 🗄️ Configuración de Base de Datos

### Paso 1: Ejecutar el Schema SQL

En tu proyecto de Supabase, ejecuta el archivo `database/houses_schema.sql`:

1. Abre tu proyecto en Supabase
2. Ve a SQL Editor
3. Copia y pega el contenido de `database/houses_schema.sql`
4. Ejecuta el script

Esto creará las siguientes tablas:
- `houses` - Información de las casas
- `house_members` - Miembros de cada casa
- `fragmentos` - Moneda de casas
- `house_points` - Puntos mensuales
- `house_achievements` - Logros y badges
- `house_alliances` - Alianzas entre casas
- `house_events` - Eventos intercasas
- `mentors` - Mentores registrados
- `mentorship_sessions` - Sesiones de mentoría
- `house_history` - Historial de eventos (Libro de las Casas)

### Paso 2: Verificar las Tablas

Verifica que todas las tablas se crearon correctamente:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'house%' 
  OR table_name = 'fragmentos' 
  OR table_name = 'mentors';
```

## 🏠 Crear las Casas

Una vez que el bot esté ejecutándose, un administrador debe crear las 4 casas.

### Comando

```
/house create 
  name: "Nombre de la Casa"
  description: "Descripción de la casa"
  color: "#HEXCODE" 
  emoji: "🔥"
```

### Ejemplos Recomendados

```
/house create 
  name: "Phoenix" 
  description: "Casa de la innovación y creatividad tecnológica" 
  color: "#FF6B35" 
  emoji: "🔥"
```

```
/house create 
  name: "Dragon" 
  description: "Casa de la fortaleza y determinación" 
  color: "#004E89" 
  emoji: "🐲"
```

```
/house create 
  name: "Griffin" 
  description: "Casa de la sabiduría y estrategia" 
  color: "#8B4513" 
  emoji: "🦅"
```

```
/house create 
  name: "Kraken" 
  description: "Casa de la colaboración y adaptabilidad" 
  color: "#1B998B" 
  emoji: "🐙"
```

### Colores Sugeridos

- **Rojo/Naranja**: `#FF6B35`, `#E63946`, `#F77F00`
- **Azul**: `#004E89`, `#0077B6`, `#4361EE`
- **Café/Dorado**: `#8B4513`, `#C1666B`, `#A67C52`
- **Verde/Turquesa**: `#1B998B`, `#06D6A0`, `#52B788`

## 👑 Asignar Roles

El sistema de casas tiene tres roles:

### Roles Disponibles

1. **Miembro (member)**: Rol por defecto
2. **Organizador de Eventos (event_organizer)**: Coordina eventos internos
3. **Líder de la Casa (leader)**: Supervisa la casa y el programa de mentoría

### Asignar un Líder

```
/house assign 
  user: @usuario 
  role: "leader"
```

### Asignar un Organizador de Eventos

```
/house assign 
  user: @usuario 
  role: "event_organizer"
```

### Permisos

- **Administradores**: Pueden asignar cualquier rol en cualquier casa
- **Líderes**: Solo pueden asignar roles en su propia casa

## 💰 Sistema de Recompensas

### Otorgar Fragmentos y Puntos

Los líderes y administradores pueden otorgar recompensas:

```
/house award 
  user: @usuario 
  fragmentos: 50 
  points: 100 
  reason: "Participación destacada en hackathon"
```

### Guía de Recompensas Sugeridas

| Actividad | Fragmentos | Puntos | Razón |
|-----------|------------|--------|-------|
| Participación en evento | 25-50 | 50-100 | Asistencia y participación |
| Primer lugar en evento | 100-150 | 200-300 | Victoria en competencia |
| Mentoría completada | 30-40 | 60-80 | Sesión de mentoría certificada |
| Ayuda a compañeros | 20-30 | 40-60 | Colaboración activa |
| Organización de evento | 50-75 | 100-150 | Liderar organización |

### Conversión de Fragmentos

Los estudiantes pueden convertir fragmentos a monedas:
- **Tasa de conversión**: 10 fragmentos = 1 moneda

```
/fragmentos convert amount: 100
```
Esto convertiría 100 fragmentos en 10 monedas.

## 👨‍🏫 Programa de Mentores

### Requisitos

- Solo estudiantes de **2do y 3ro de Bachillerato** pueden ser mentores
- Deben estar asignados a una casa
- El líder de la casa debe certificarlos

### Registro de Mentores

Los estudiantes se registran con:

```
/mentor register 
  availability: "Lunes y Miércoles 15:00-17:00"
```

### Certificación de Mentores

Los líderes certifican a los mentores:

```sql
-- En Supabase SQL Editor
UPDATE mentors 
SET certified = true 
WHERE mentorId = 'DISCORD_USER_ID';
```

O mediante una interfaz personalizada que puedes desarrollar.

### Ver Mentores Disponibles

Los estudiantes pueden ver mentores con:

```
/mentor list
```

## 📊 Gestión del Ranking

### Ranking Mensual

- Los puntos se acumulan mensualmente
- Cada mes comienza un nuevo ranking
- Los puntos del mes anterior se mantienen en el historial

### Sellos de Honor

Al final de cada mes, los administradores pueden otorgar **Sellos de Honor** a los miembros más destacados:

```
/house award 
  user: @usuario 
  fragmentos: 0 
  points: 0 
  reason: "Sello de Honor - Top del Mes de Octubre"
```

Luego, otorgar el achievement:

```sql
-- En Supabase
INSERT INTO house_achievements (userId, houseId, achievementType, metadata)
VALUES (
  'DISCORD_USER_ID',
  'HOUSE_UUID',
  'honor_seal',
  '{"month": "octubre", "year": 2024, "position": 1}'::jsonb
);
```

## 🏆 Sistema de Logros

### Tipos de Logros

- `event_participation` - Participación en evento
- `mentor` - Mentor certificado
- `organizer` - Organizador de eventos
- `honor_seal` - Sello de honor mensual
- `alliance` - Alianza formada
- `top_monthly` - Top del mes
- `first_place` - Primer lugar
- `event_win` - Victoria en evento

### Otorgar Logros

```sql
-- En Supabase
INSERT INTO house_achievements (userId, houseId, achievementType, metadata)
VALUES (
  'DISCORD_USER_ID',
  'HOUSE_UUID',
  'event_participation',
  '{"event": "Hackathon 2024", "position": 2}'::jsonb
);
```

## 🎮 Gestión de Discord (Opcional)

### Crear Categorías de Casas

Para cada casa, puedes crear manualmente en Discord:

1. **Categoría de la Casa** (nombre: "🔥 PHOENIX")
2. **Canales dentro de la categoría**:
   - `🏠-canal-principal` - Discusiones generales
   - `🎮-eventos` - Anuncios y coordinación
   - `👨‍🏫-mentoría` - Comunicación mentores
   - `🎯-logros` - Celebración de logros
   - `🤝-alianzas` - Coordinación con aliados

### Permisos Recomendados

- **Canal Principal**: Todos pueden leer y escribir
- **Eventos**: Organizadores y líderes pueden mencionar @everyone
- **Mentoría**: Solo mentores certificados y mentees
- **Logros**: Solo lectura, escritura para líderes
- **Alianzas**: Solo líderes

## 📝 Mantenimiento

### Tareas Mensuales

1. **Revisar ranking**: Ver quiénes merecen Sellos de Honor
2. **Otorgar recompensas**: Dar fragmentos/puntos a destacados
3. **Certificar mentores**: Aprobar nuevos mentores
4. **Actualizar libro**: El sistema lo hace automáticamente

### Monitoreo

Consultas útiles en Supabase:

```sql
-- Ver ranking de todas las casas
SELECT h.name, h.points, COUNT(hm.userId) as members
FROM houses h
LEFT JOIN house_members hm ON h.id = hm.houseId
GROUP BY h.id
ORDER BY h.points DESC;

-- Ver top miembros del mes actual
SELECT 
  hp.userId,
  hm.username,
  h.name as house_name,
  hp.points
FROM house_points hp
JOIN house_members hm ON hp.userId = hm.userId
JOIN houses h ON hp.houseId = h.id
WHERE hp.month = EXTRACT(MONTH FROM NOW())
  AND hp.year = EXTRACT(YEAR FROM NOW())
ORDER BY hp.points DESC
LIMIT 10;

-- Ver balance de fragmentos
SELECT 
  f.userId,
  hm.username,
  f.amount as fragmentos,
  h.name as house_name
FROM fragmentos f
JOIN house_members hm ON f.userId = hm.userId
JOIN houses h ON f.houseId = h.id
ORDER BY f.amount DESC;
```

## 🆘 Solución de Problemas

### Error: Usuario no puede unirse a casa

- Verificar que las casas existan en la base de datos
- Verificar que el usuario no esté ya en una casa

### Error: No se pueden otorgar fragmentos

- Verificar que el usuario pertenezca a una casa
- Verificar que el líder tenga permisos

### Mentor no puede registrarse

- Verificar que el usuario esté en 2do o 3ro de Bachillerato
- Verificar que tenga el campo `curso` configurado en la tabla `coins`

### Ranking no muestra datos

- Verificar que haya puntos otorgados en el mes actual
- Verificar las fechas en la tabla `house_points`

## 📞 Soporte

Para más ayuda, consulta:
- README.md
- CasasSystem.md
- Documentación de Supabase
- Discord.js Documentation

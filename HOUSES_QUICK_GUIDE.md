# Sistema de Casas - Guía Rápida

## 📖 Para Estudiantes

### Unirse a una Casa
```
/house join
```
Selecciona tu casa del menú desplegable.

### Ver Información de tu Casa
```
/house info        # Información general
/house members     # Lista de miembros
/house ranking     # Ranking mensual
/house points      # Tus puntos del mes
```

### Fragmentos
```
/fragmentos get                # Ver balance
/fragmentos convert amount:100 # Convertir a monedas (10:1)
```

### Logros y Historia
```
/achievements      # Ver tus logros
/housebook        # Ver historia de tu casa
```

### Mentores (Solo 2do y 3ro)
```
/mentor register availability:"Lunes 15:00-17:00"
/mentor list       # Ver mentores disponibles
```

## 👑 Para Líderes y Administradores

### Crear Casas (Solo Admin)
```
/house create 
  name:"Phoenix" 
  description:"Casa de innovación" 
  color:"#FF6B35" 
  emoji:"🔥"
```

### Asignar Roles
```
/house assign user:@usuario role:"leader"
/house assign user:@usuario role:"event_organizer"
/house assign user:@usuario role:"member"
```

### Otorgar Recompensas
```
/house award 
  user:@usuario 
  fragmentos:50 
  points:100 
  reason:"Participación en hackathon"
```

## 💡 Valores de Recompensa Sugeridos

| Actividad | Fragmentos | Puntos |
|-----------|------------|--------|
| Participación básica | 25 | 50 |
| Participación destacada | 50 | 100 |
| Primer lugar | 150 | 300 |
| Mentoría completada | 35 | 70 |
| Organización de evento | 60 | 120 |

## 🎯 Roles en las Casas

- **Miembro**: Rol estándar
- **Organizador de Eventos**: Coordina actividades internas
- **Líder de la Casa**: Gestiona la casa y programa de mentoría

## 📊 Sistema de Puntos

- Puntos se acumulan **mensualmente**
- Ranking se reinicia cada mes
- Los mejores reciben **Sellos de Honor**
- Fragmentos se convierten a monedas (10:1)

## 🏆 Logros Disponibles

- 🎯 Participación en Evento
- 👨‍🏫 Mentor Certificado
- 🎪 Organizador de Eventos
- 🏅 Sello de Honor
- 🤝 Alianza Formada
- 🌟 Top del Mes
- 🥇 Primer Lugar
- 🏆 Victoria en Evento

## ❓ Preguntas Frecuentes

**¿Puedo cambiar de casa?**
No, la decisión de unirse a una casa es permanente.

**¿Cómo obtengo fragmentos?**
Participando en eventos, siendo mentor, ayudando a la casa.

**¿Para qué sirven los fragmentos?**
Se convierten a monedas (10 fragmentos = 1 moneda).

**¿Quién puede ser mentor?**
Solo estudiantes de 2do y 3ro de Bachillerato.

**¿Cómo subo en el ranking?**
Ganando puntos por participación y logros en el mes actual.

## 📚 Más Información

- Ver `HOUSES_SETUP.md` para configuración detallada
- Ver `CasasSystem.md` para el diseño completo del sistema
- Ver `README.md` para información general del bot

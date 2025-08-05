# Documentación de Arquitectura de Backend: Monolítica vs. Microservicios "Deal Online"

## Comparativo: Arquitectura Monolítica vs. Microservicios

## 1. Introducción

En el desarrollo de software, la arquitectura de un sistema es crucial para su escalabilidad, mantenimiento y evolución. Tradicionalmente, muchas aplicaciones se construían con una arquitectura monolítica. Sin embargo, para proyectos más complejos y distribuidos como "Deal Online", la arquitectura de microservicios ofrece ventajas significativas.

## 2. Arquitectura Monolítica

Una arquitectura monolítica es un enfoque de diseño donde todas las funcionalidades de una aplicación (interfaz de usuario, lógica de negocio, acceso a datos) se empaquetan en una única unidad de despliegue.

## 3. Arquitectura de Microservicios: "Deal Online"

La arquitectura de microservicios descompone una aplicación en un conjunto de servicios pequeños, independientes y débilmente acoplados. Cada microservicio se enfoca en una funcionalidad específica, se ejecuta en su propio proceso y se comunica con otros microservicios a través de APIs bien definidas.

## 4. Comparación General

| Característica                | Arquitectura Monolítica                           | Arquitectura de Microservicios                        |
|-------------------------------|---------------------------------------------------|------------------------------------------------------|
| **Estructura**                | Una sola aplicación con todo el backend integrado | Servicios independientes comunicándose entre sí       |
| **Escalabilidad**             | Escala en bloque, requiere replicar toda la app   | Escala de forma independiente por cada microservicio  |
| **Despliegue**                | Se despliega como un único artefacto              | Cada microservicio puede desplegarse de forma aislada |
| **Mantenimiento**             | Difícil, cambios afectan toda la aplicación       | Más sencillo, cambios acotados a un servicio          |
| **Tecnologías**               | Normalmente un único stack                        | Se pueden usar diferentes tecnologías por servicio    |
| **Tolerancia a Fallos**       | Si falla un módulo, cae toda la aplicación        | Fallos aislados al microservicio correspondiente      |
| **Comunicación**              | Llamadas internas                                | API REST / WebSocket / Mensajería                     |

---

## 5. Diagramas de Arquitectura

### 5.1 Arquitectura Monolítica
![Arquitectura Monolítica](docs/img/monolitica.png)

- **Acoplamiento:** Todos los componentes están fuertemente acoplados, lo que significa que un cambio en una parte del código puede afectar a otras.
- **Despliegue:** La aplicación completa debe ser desplegada cada vez que se realiza un cambio, incluso pequeño.
- **Escalabilidad:** Escalar la aplicación significa escalar toda la unidad, incluso si solo una parte del sistema está experimentando alta demanda.
- **Tecnología Única:** Generalmente, se utiliza una única tecnología o un conjunto muy limitado para todo el proyecto.

### 5.2 Arquitectura de Microservicios
![Arquitectura de Microservicios](docs/img/microservicios.png)

### Explicación de Componentes y Tecnología Utilizada

La arquitectura "Deal Online" se basa en los siguientes componentes principales y tecnologías:

#### API Gateway
- Es el orquestador principal y el punto de entrada para todas las peticiones externas. Redirige las solicitudes a los microservicios apropiados y maneja la autenticación y la seguridad.
- **Tecnología:** Node.js con NestJS.
- **Puerto de Acceso:** http://localhost:3050

#### Microservicios Principales

- **Auth Service:** Gestiona el registro, inicio de sesión y verificación de usuarios.
  - **Tecnología:** Node.js (TypeScript)
  - **Base de Datos:** PostgreSQL (auth-db)
  - **Mensajería:** RabbitMQ

- **Auction Service:** Maneja la creación, listado y gestión de pujas para subastas.
  - **Tecnología:** Node.js (TypeScript)
  - **Base de Datos:** PostgreSQL (auction-db)

- **Chat Service:** Administra el historial de mensajes y la comunicación en tiempo real.
  - **Tecnología:** Node.js (TypeScript)
  - **Base de Datos:** PostgreSQL (chat-db)

- **Email Service:** Envío de correos electrónicos.
  - **Tecnología:** Node.js (TypeScript)
  - **Cola:** RabbitMQ (emails_queue)

#### RabbitMQ
- Broker de mensajes para comunicación asíncrona.
- **Puerto de gestión:** http://localhost:15672

#### Prometheus y Grafana
- **Prometheus:** Recolecta métricas de microservicios. http://localhost:9090
- **Grafana:** Visualiza métricas. http://localhost:3005

#### Docker y Docker Compose
- Cada microservicio y dependencia está empaquetado como contenedor.
- `docker-compose.yml` define toda la infraestructura.

### 5.3 Evolución: De Monolito a Microservicios
![Evolución hacia Microservicios](docs/img/evolucion.png)

La evolución de un **monolito** hacia una **arquitectura de microservicios** en este proyecto se realizó en varias etapas:

1. **Monolito Inicial**
   - Todo el backend se encontraba en un único bloque de código.
   - Los módulos de autenticación, subastas, chat y notificaciones estaban acoplados.
   - Esto dificultaba la escalabilidad y el mantenimiento.

2. **Identificación de Dominios**
   - Se analizaron las funcionalidades principales para separarlas en servicios:
     - **AuthService**: gestión de usuarios y autenticación con JWT.
     - **AuctionService**: control de subastas y pujas.
     - **ChatService**: mensajería en tiempo real.
     - **EmailService**: envío de notificaciones vía SMTP.

3. **Separación en Microservicios**
   - Cada dominio se convirtió en un servicio independiente.
   - Se implementó un **API Gateway** (Express.js) para centralizar las peticiones.
   - Se añadió **Socket.IO** for la comunicación en tiempo real en subastas y chat.

4. **Seguridad y Comunicación**
   - Se implementó un middleware para **validación de JWT** en cada microservicio.
   - Los servicios se comunican entre sí mediante REST y WebSocket, reduciendo el acoplamiento.

5. **Base de Datos y Notificaciones**
   - Los microservicios acceden a **PostgreSQL** con sus propias consultas.
   - El **EmailService** se conecta a Gmail SMTP para notificaciones automáticas.

Este cambio permitió que el sistema sea **más escalable, seguro y fácil de mantener**, eliminando la dependencia de un único bloque monolítico.

### 5.4 Patrones de Microservicios Implementados

#### 1. Patrón: API Gateway
- **Descripción:** Un único servidor actúa como el punto de entrada principal para todas las peticiones de los clientes (como el frontend). Centraliza la autenticación y redirige las solicitudes al microservicio correspondiente.
- **Implementación:**
  - Microservicio dedicado `api-gateway` usando Nest.js.
  - Expuesto en el puerto `http://localhost:3050`.
  - Valida tokens JWT para rutas protegidas.
  - Actúa como proxy inverso, redirigiendo peticiones HTTP (ej. `/api/auth/login`) y conexiones WebSocket (ej. `/chat/socket.io`) a los servicios internos (`auth-service`, `chat-service`, etc.) usando nombres de servicio de Docker.

#### 2. Patrón: Database per Service
- **Descripción:** Cada microservicio tiene su propia base de datos privada, garantizando bajo acoplamiento y aislamiento de datos.
- **Implementación:**
  - Definimos bases de datos PostgreSQL separadas en `docker-compose.yml`:
    - `auth-db` para `auth-service`.
    - `auction-db` para `auction-service`.
    - `chat-db` para `chat-service`.
  - Cada servicio se conecta exclusivamente a su base de datos designada, aislando datos de usuarios, subastas y chats.

#### 3. Patrón: Service Discovery
- **Descripción:** Permite a los servicios localizarse entre sí usando nombres lógicos en lugar de direcciones IP dinámicas, ideal para entornos como Docker.
- **Implementación:**
  - Implementado automáticamente mediante Docker Compose.
  - La red `deal-network` permite resolver nombres de servicios (ej. `http://auth-service:3001`) a las IPs correctas de los contenedores.

#### 4. Patrón: Comunicación Asíncrona con Message Broker
- **Descripción:** Los servicios se comunican de forma asíncrona a través de un message broker, publicando y consumiendo mensajes sin esperar respuestas inmediatas.
- **Implementación:**
  - Usamos RabbitMQ como message broker.
  - Ejemplo: Durante el registro de usuarios:
    1. `auth-service` guarda el usuario y publica un evento `user_registered` en una cola de RabbitMQ.
    2. `email-service` consume el evento y envía un correo de confirmación.
  - Mejora la velocidad y resiliencia, permitiendo que el registro continúe incluso si el envío de correos falla.

---

## 6. Refactorización del Backend a Microservicios

El backend originalmente monolítico fue refactorizado siguiendo este enfoque:

1. **Identificación de Dominios**: Se dividió la lógica principal en módulos (Auth, Auction, Chat, Email).
2. **Separación de Responsabilidades**:
   - Se aislaron controladores y servicios que antes estaban juntos.
   - Cada módulo maneja su propia lógica y validaciones.
3. **Comunicación entre Servicios**:
   - Se habilitó un **API Gateway** con Express.js para gestionar las rutas REST.
   - Se incorporó **Socket.IO** para la mensajería en tiempo real.
4. **Autenticación Descentralizada**:
   - Se implementó un **middleware de autenticación** con JWT para proteger las rutas.
5. **Persistencia**:
   - Todos los servicios se comunican con **PostgreSQL**, pero cada uno a través de su propio esquema de acceso.
6. **Notificaciones Externas**:
   - El servicio de correo (EmailService) se conecta vía SMTP a Gmail para alertas y confirmaciones.

## 7. Arquitectura Final del Proyecto

```markdown
📁 deal-online/
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 ci-cd.yml
├── 📁 api-gateway/
│   ├── 📁 src/
│   │   ├── 📁 auth/
│   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   └── 📄 jwt.strategy.ts
│   │   ├── 📄 app.module.ts
│   │   └── 📄 main.ts
│   ├── 📄 .env
│   └── 📄 Dockerfile
├── 📁 microservices/
│   ├── 📁 auth-service/
│   │   ├── 📁 src/
│   │   ├── 📄 .env
│   │   └── 📄 Dockerfile
│   ├── 📁 auction-service/
│   │   ├── 📁 src/
│   │   ├── 📄 .env
│   │   └── 📄 Dockerfile
│   ├── 📁 chat-service/
│   │   ├── 📁 src/
│   │   ├── 📄 .env
│   │   └── 📄 Dockerfile
│   └── 📁 email-service/
│       └── 📄 Dockerfile
├── 📁 monitoring/
│   ├── 📄 prometheus.yml
│   ├── 📄 .env
│   └── 📄 Dockerfile
└── 📄 docker-compose.yml
```

## 8. Conclusión

La migración de una arquitectura monolítica a microservicios en "Deal Online" permitió:

- **Escalabilidad mejorada** mediante servicios independientes que pueden escalarse individualmente.
- **Mayor mantenibilidad** al separar responsabilidades y limitar el impacto de los cambios.
- **Comunicación en tiempo real** eficiente con Socket.IO para subastas y chat.
- **Seguridad robusta** con validación de JWT en rutas protegidas.
- **Notificaciones externas** integradas mediante Gmail SMTP.
- **Patrones de microservicios** implementados (API Gateway, Database per Service, Service Discovery, Comunicación Asíncrona) que aseguran un diseño robusto, desacoplado y escalable.

Estos cambios han transformado el sistema en una solución más flexible, resiliente y preparada para futuros crecimientos.
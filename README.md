# 🏗️ Sistema de Gestión de Obras de Construcción

Sistema completo de gestión de obras de construcción con funcionalidades CRUD, colaboración en tiempo real y reportes avanzados.

## 🚀 Características Principales

- **Gestión de Proyectos**: CRUD completo de obras de construcción
- **Gestión de Actividades**: Seguimiento de tareas y actividades
- **Gestión de Usuarios**: Sistema de usuarios con roles
- **Gestión de Clientes**: Base de datos de clientes
- **Gestión de Archivos**: Subida y descarga de documentos
- **Dashboard Interactivo**: Gráficos y estadísticas en tiempo real
- **Colaboración**: Chat en tiempo real entre usuarios
- **Reportes**: Exportación de datos en Excel

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Iconos**: Bootstrap Icons
- **Gráficos**: Chart.js
- **Tiempo Real**: Socket.io

## 📋 Requisitos del Sistema

- Node.js 16+ 
- MySQL 8.0+
- NPM o Yarn

## 🚀 Deploy en Railway (Recomendado)

### Deploy Automático con MySQL

1. **Sube tu código a GitHub**
2. **Ve a [Railway.app](https://railway.app)**
3. **Crea una cuenta o inicia sesión con GitHub**
4. **Haz clic en "New Project"**
5. **Selecciona "Deploy from GitHub repo"**
6. **Conecta tu repositorio de GitHub**
7. **Railway detectará automáticamente que es un proyecto Node.js**

### 🗄️ Configurar Base de Datos MySQL en Railway

1. **En tu proyecto, haz clic en "New"**
2. **Selecciona "Database" → "MySQL"**
3. **Railway creará automáticamente una base de datos MySQL**
4. **Copia las variables de entorno que Railway genera**

### 📊 Inicializar la Base de Datos

1. **Conecta a tu base de datos MySQL en Railway**
2. **Ejecuta el script SQL desde `database/schema.sql`**
3. **Inserta datos de prueba desde `database/sample-data.sql`**

### Variables de Entorno en Railway

Railway configurará automáticamente estas variables:
```
NODE_ENV=production
PORT=3000
DB_HOST=[Host de Railway]
DB_USER=[Usuario de Railway]
DB_PASSWORD=[Contraseña de Railway]
DB_NAME=[Nombre de la base de datos]
DB_PORT=3306
SESSION_SECRET=[Genera una clave secreta]
UPLOAD_PATH=./public/uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://tu-app.railway.app
```

## 🔧 Instalación Local

1. **Clona el repositorio:**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd construction-management-system
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   ```bash
   cp env.example .env
   # Edita el archivo .env con tus configuraciones
   ```

4. **Configura la base de datos:**
   - Crea una base de datos MySQL llamada `construction_management`
   - Ejecuta el script `database/schema.sql`
   - Opcionalmente, ejecuta `database/sample-data.sql` para datos de prueba

5. **Inicia el servidor:**
   ```bash
   npm start
   # o para desarrollo:
   npm run dev
   ```

6. **Abre tu navegador en:** `http://localhost:3000`

## 👥 Usuarios por Defecto

- **Administrador**: `admin@admin.com` / `admin123`
- **Gerente**: `gerente@gerente.com` / `gerente123`
- **Usuario**: `usuario@usuario.com` / `usuario123`

## 📁 Estructura del Proyecto

```
construction-management-system/
├── public/                 # Archivos estáticos
│   ├── css/               # Estilos CSS
│   ├── js/                # JavaScript del frontend
│   ├── images/            # Imágenes y recursos
│   └── uploads/           # Archivos subidos
├── routes/                # Rutas de la API
├── database/              # Scripts de base de datos
├── server.js              # Servidor principal
├── package.json           # Dependencias del proyecto
├── render.yaml            # Configuración para Render
└── README.md              # Este archivo
```

## 🔒 Seguridad

- Autenticación con sesiones
- Validación de datos de entrada
- Sanitización de consultas SQL
- Protección contra ataques comunes
- CORS configurado

## 📈 Monitoreo

- Logs de acceso con Morgan
- Compresión de respuestas
- Headers de seguridad con Helmet
- Manejo de errores centralizado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación

---

**¡Gracias por usar nuestro sistema de gestión de obras! 🏗️✨**
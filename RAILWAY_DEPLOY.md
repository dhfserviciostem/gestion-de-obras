# 🚀 Deploy en Railway

## 📋 Pasos para deployar en Railway:

### **1. Crear cuenta en Railway**
1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Login"
3. Selecciona "Continue with GitHub"
4. Autoriza los permisos

### **2. Crear nuevo proyecto**
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Conecta tu repositorio: `dhfserviciostem/gestion-de-obras`
4. Railway detectará automáticamente que es un proyecto Node.js

### **3. Configurar base de datos MySQL**
1. En tu proyecto, haz clic en "New"
2. Selecciona "Database" → "MySQL"
3. Railway creará automáticamente una base de datos MySQL
4. Copia las variables de entorno que Railway genera

### **4. Configurar variables de entorno**
En tu servicio web, agrega estas variables:
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

### **5. Inicializar la base de datos**
1. Ve a tu base de datos MySQL en Railway
2. Haz clic en "Connect"
3. Usa las credenciales para conectarte
4. Ejecuta el script `database/schema.sql`
5. Opcionalmente, ejecuta `database/sample-data.sql`

### **6. Verificar el deploy**
1. Railway desplegará automáticamente tu aplicación
2. Obtendrás una URL como: `https://tu-app.railway.app`
3. Verifica que la aplicación funcione correctamente

## ✅ Ventajas de Railway:
- MySQL nativo (más rápido)
- Deploy automático desde GitHub
- Variables de entorno automáticas
- SSL automático
- Muy similar a Render

## ⚠️ Límites gratuitos:
- 500 horas de ejecución por mes
- 1GB de RAM
- 1GB de almacenamiento
- Base de datos MySQL incluida

## 🎯 Resultado esperado:
Tu aplicación estará disponible en una URL como:
`https://gestion-de-obras-production.railway.app`

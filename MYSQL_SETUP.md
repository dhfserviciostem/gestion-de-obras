# Solución para Error de MySQL

## 🔍 Diagnóstico del Problema
El error "Acceso denegado a MySQL" puede tener varias causas:

1. MySQL no está instalado
2. MySQL no está ejecutándose
3. Credenciales incorrectas
4. Puerto bloqueado

## 🛠️ Soluciones Paso a Paso

### Opción 1: Verificar si MySQL está instalado y ejecutándose

#### En Windows:
```cmd
# Verificar si MySQL está instalado
mysql --version

# Verificar servicios de MySQL
net start | findstr MySQL

# Iniciar MySQL si está detenido
net start MySQL80  # o el nombre de tu servicio MySQL
```

#### En Linux/Mac:
```bash
# Verificar si MySQL está ejecutándose
sudo systemctl status mysql

# Iniciar MySQL
sudo systemctl start mysql
```

### Opción 2: Instalar MySQL (si no está instalado)

#### Windows:
1. Descargar MySQL desde: https://dev.mysql.com/downloads/installer/
2. Ejecutar el instalador
3. Configurar usuario root con contraseña `admin123456`

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### Mac (con Homebrew):
```bash
brew install mysql
brew services start mysql
```

### Opción 3: Configurar MySQL manualmente

1. **Conectar a MySQL como root:**
   ```bash
   mysql -u root -p
   ```

2. **Crear la base de datos:**
   ```sql
   CREATE DATABASE construction_management;
   USE construction_management;
   ```

3. **Ejecutar el esquema:**
   ```bash
   mysql -u root -p construction_management < database/schema.sql
   ```

4. **Cargar datos de ejemplo:**
   ```bash
   mysql -u root -p construction_management < database/sample_data.sql
   ```

### Opción 4: Usar XAMPP/WAMP (Más fácil para desarrollo)

1. **Descargar XAMPP:** https://www.apachefriends.org/
2. **Instalar y ejecutar**
3. **Iniciar MySQL desde el panel de control**
4. **Usar phpMyAdmin para crear la base de datos**

### Opción 5: Configuración alternativa con diferentes credenciales

Si tu MySQL tiene credenciales diferentes, edita el archivo `.env`:

```env
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=construction_management
```

## 🚀 Iniciar el Sistema

Una vez configurado MySQL:

```bash
# Verificar conexión
node -e "const mysql = require('mysql2'); const conn = mysql.createConnection({host:'localhost', user:'root', password:'admin123456'}); conn.connect(err => console.log(err ? 'Error: ' + err.message : 'Conexión exitosa')); conn.end();"

# Iniciar el servidor
npm start
```

## 🆘 Si Nada Funciona

Usa SQLite como alternativa temporal:

1. Instalar SQLite:
   ```bash
   npm install sqlite3
   ```

2. Modificar `server.js` para usar SQLite temporalmente

## 📞 Verificación Rápida

Ejecuta este comando para verificar la conexión:
```bash
mysql -u root -p -e "SELECT 'MySQL funcionando correctamente' as status;"
```

Si ves el mensaje "MySQL funcionando correctamente", entonces MySQL está funcionando y el problema es de configuración.

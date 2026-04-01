# Cydens Print Server

Servidor local de impresión térmica para Cydens. Recibe trabajos de impresión desde la aplicación web y los envía directamente a la impresora térmica via ESC/POS.

## Requisitos

- Windows 10 / 11
- Impresora térmica de 80mm conectada por USB (compatible ESC/POS)
- Conexión a internet (solo para instalación y actualizaciones)

No requiere instalar Node.js ni Git.

---

## Instalación

### 1. Descargar los archivos

Ir a la página de releases del repositorio y descargar:

- `cydens-print-server.exe`
- `instalar.bat`
- `desinstalar.bat`
- `startup-launcher.vbs`
- `update-runner.bat`

Colocar todos los archivos en la misma carpeta (por ejemplo, el Escritorio).

### 2. Ejecutar el instalador

Click derecho en `instalar.bat` → **Ejecutar como administrador**

El instalador va a:
1. Mostrar la lista de impresoras instaladas en el equipo
2. Pedir que selecciones la impresora por número
3. Copiar los archivos a `C:\cydens-print\`
4. Configurar el servidor para que inicie automáticamente con Windows
5. Arrancar el servidor inmediatamente

### 3. Verificar que funciona

Abrir el navegador y entrar a:

```
http://localhost:3001/status
```

Debería responder:

```json
{ "ok": true, "printer": "nombre de tu impresora" }
```

---

## Desinstalación

Click derecho en `desinstalar.bat` → **Ejecutar como administrador**

Los archivos en `C:\cydens-print\` pueden eliminarse manualmente después.

---

## Actualizaciones

Cuando hay una nueva versión disponible, desde la aplicación web de Cydens ir a cualquier orden → **Imprimir** → botón **"Actualizar servidor de impresión"**.

El servidor descarga el nuevo ejecutable, se reemplaza y reinicia automáticamente. La configuración de la impresora se mantiene.

---

## Cambiar la impresora configurada

Editar el archivo `C:\cydens-print\config.json`:

```json
{ "printer": "Nombre de la impresora" }
```

Reiniciar el servidor cerrando y volviendo a abrir `startup-launcher.vbs`, o reiniciando la PC.

Para ver los nombres exactos de las impresoras instaladas, abrir PowerShell y ejecutar:

```powershell
Get-Printer | Select-Object Name
```

---

## Estructura de archivos instalados

```
C:\cydens-print\
├── cydens-print-server.exe   ← servidor de impresión
├── config.json               ← configuración (impresora seleccionada)
├── startup-launcher.vbs      ← arranque sin ventana al iniciar Windows
├── update-runner.bat         ← usado internamente para actualizaciones
└── desinstalar.bat           ← desinstalador
```

---

## Solución de problemas

**El servidor no arranca**
- Verificar que la impresora esté encendida y conectada
- Abrir el Administrador de tareas → buscar `cydens-print-server.exe`
- Si no aparece, ejecutar `startup-launcher.vbs` manualmente

**"No se pudo conectar con el servidor de impresión"**
- El servidor no está corriendo en la PC
- Verificar en `http://localhost:3001/status`
- Reiniciar ejecutando `startup-launcher.vbs`

**Sale texto ilegible o caracteres extraños**
- La impresora seleccionada no es la correcta
- Verificar `C:\cydens-print\config.json` y corregir el nombre

**El trabajo de impresión queda trabado en la cola**
- Abrir CMD como administrador y ejecutar:
```cmd
net stop spooler
del /Q /F /S "%systemroot%\System32\spool\PRINTERS\*.*"
net start spooler
```

const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'Cydens Print Server',
  description: 'Servidor de impresion termica para Cydens',
  script: path.join(__dirname, 'server.js'),
  env: {
    name: 'PRINTER_NAME',
    value: process.env.PRINTER_NAME || '80mm Series Printer',
  },
});

svc.on('install', () => {
  console.log('');
  console.log('========================================');
  console.log(' Servicio instalado correctamente!');
  console.log(' El servidor de impresion iniciara');
  console.log(' automaticamente con Windows.');
  console.log('========================================');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('El servicio ya estaba instalado.');
  console.log('Para reinstalar, primero ejecuta desinstalar-servicio.bat');
});

svc.on('error', (err) => {
  console.error('Error al instalar:', err);
});

svc.install();

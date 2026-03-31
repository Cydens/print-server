const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'Cydens Print Server',
  script: path.join(__dirname, 'server.js'),
});

svc.on('uninstall', () => {
  console.log('');
  console.log('========================================');
  console.log(' Servicio desinstalado correctamente.');
  console.log('========================================');
});

svc.on('error', (err) => {
  console.error('Error al desinstalar:', err);
});

svc.uninstall();

// ===== Content Data Route =====
// Serves the CMS module list as a JavaScript global (window.MODULES_DATA),
// consumed by the front-end. Extracted verbatim from server.js. This router is
// mounted before the static /js handler so it shadows js/modules-data.js on disk.
const express = require('express');

module.exports = function createContentRouter({ content }) {
  const router = express.Router();

  router.get('/js/modules-data.js', (req, res) => {
    const mods = content.getModules();
    const json = JSON.stringify(mods).replace(/<\//g, '<\\/');
    res.type('application/javascript').send('window.MODULES_DATA = ' + json + ';');
  });

  return router;
};

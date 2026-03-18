const { registerCatalogusCoreRoutes } = require("./catalogusCoreRoutes");
const { registerCatalogusMotorRoutes } = require("./catalogusMotorRoutes");
const { registerCatalogusImportRoutes } = require("./catalogusImportRoutes");

function registerCatalogusRoutes(deps) {
  registerCatalogusCoreRoutes(deps);
  registerCatalogusMotorRoutes(deps);
  registerCatalogusImportRoutes(deps);
}

module.exports = { registerCatalogusRoutes };

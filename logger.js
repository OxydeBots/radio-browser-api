const colors = require("colors/safe");
const moment = require("moment");

moment.locale("fr");

module.exports = class Logger {
  static log(content, type = "log") {
    const date = moment().format("DD-MM-YYYY HH:mm:ss");

    const colorConfig = {
      Logs: colors.blue,
      Denied: colors.yellow,
      Login: colors.green,
      Error: colors.red,
      Loading: colors.cyan,
    };

    const selectedColor = colorConfig[type] || colors.red;
    const formattedType = type.toUpperCase();

    if (colorConfig[type]) {
      const lines = content.split('\n');
      lines.forEach(line => {
        console.log(`[${colors.gray(date)}]: [${selectedColor(formattedType)}] | ${line}`);
      });
    } else {
      console.log(`[${colors.gray(date)}]: [${colors.red("ERREUR")}] Le type est invalide : ${formattedType}`);
    }
  }
};

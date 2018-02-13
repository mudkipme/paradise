import fs from "fs";
import mkdirp from "mkdirp";
import path from "path";
import winston from "winston";

const logDir = path.join(__dirname, "../../data/logs");

if (!fs.existsSync(logDir)) {
    mkdirp.sync(logDir);
}

winston.level = "info";
winston.add(winston.transports.File, { name: "error", filename: path.join(logDir, "error.log"), level: "error" });
winston.add(winston.transports.File, { name: "combined", filename: path.join(logDir, "combined.log")});

export default winston;

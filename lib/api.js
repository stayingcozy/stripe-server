"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
// all input will be string converts to javascript object
exports.app.use(express_1.default.json()); // middleware
const cors_1 = __importDefault(require("cors"));
// allows server and front end code to run different ports
exports.app.use((0, cors_1.default)({ origin: true }));
exports.app.post('/test', (req, res) => {
    const amount = req.body.amount;
    res.status(200).send({ with_tax: amount * 7 });
});
//# sourceMappingURL=api.js.map
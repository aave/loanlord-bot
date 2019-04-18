"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
var aave_js_1 = require("aave-js");
var lowdb_1 = __importDefault(require("lowdb"));
var FileAsync_1 = __importDefault(require("lowdb/adapters/FileAsync"));
var calculationHelpers_1 = require("./helpers/calculationHelpers");
var token = '';
var bot = new node_telegram_bot_api_1.default(token, { polling: true });
var marketplace = new aave_js_1.Marketplace('', 'https://api.aave.com');
var latestLoansList = null;
var formatLoanData = function (data) {
    var totalPremium = calculationHelpers_1.calculateTotalPremium(data);
    var apr = totalPremium ? totalPremium.dividedBy(data.loanAmount).multipliedBy(100).toFixed(2) : 0;
    var message = "<b>----- LOAN REQUEST ------</b> \n\n Address: \n <b>" + data.loanAddress + "</b> \n";
    message += "Collateral:<b> " + data.collateralAmount + " " + data.collateralType + " </b> \n";
    message += "Loan amount:<b> " + data.loanAmount + " " + data.moe + " </b> \n";
    message += "APR: <b>" + apr + "%</b> \n";
    message += "Duration: <b>" + data.duration * 30 + " days</b> \n";
    message += totalPremium ? "<b>POTENTIAL EARNINGS: " + totalPremium.toString() + " " + data.moe + "</b>  \n \n " : "";
    return message;
};
var fetchAvailableLoans = function () { return __awaiter(_this, void 0, void 0, function () {
    var allRequestsAddresses, loans, _i, _a, address, loanData;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, marketplace.requests.getAllAddresses()];
            case 1:
                allRequestsAddresses = _b.sent();
                loans = [];
                _i = 0, _a = allRequestsAddresses.reverse();
                _b.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                address = _a[_i];
                return [4 /*yield*/, marketplace.requests.getLoanData(address)];
            case 3:
                loanData = _b.sent();
                if (loanData.state && loanData.state.toLowerCase() === "funding") {
                    loans.push(loanData);
                }
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/, loans];
        }
    });
}); };
bot.onText(/\/whoisthelord/, function (msg, match) {
    var message = "I'm the lords of the loans, built with the AAVE SDK, and i rule over the ETHLend world. \n";
    message += "If you want to become my subject, write to me in private and type <b>/register</b>. You shall receive notifications when i consider it appropriate.";
    message += " Type <b>/requests</b> if you want to know which loans are available on the platform to fund.";
    message += "I shall acquire more power as the AAVE SDK grows.";
    bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
});
bot.onText(/\/register/, function (msg, match) { return __awaiter(_this, void 0, void 0, function () {
    var chatId, adapter, db;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.chat.id;
                adapter = new FileAsync_1.default('data.json');
                return [4 /*yield*/, lowdb_1.default(adapter)];
            case 1:
                db = _a.sent();
                if (db.get("registrations").find(function (item) { return item.chatId === chatId; }).value()) {
                    bot.sendMessage(msg.chat.id, "This channel is already registered to receive loan notifications. If you want to receive personal notification, send the /register command in private.");
                    return [2 /*return*/];
                }
                db.get("registrations").push({ chatId: chatId }).write().then(function () {
                    bot.sendMessage(msg.chat.id, "I now bless you with the power of the ETHLend API.");
                });
                return [2 /*return*/];
        }
    });
}); });
bot.onText(/\/disablebroadcast/, function (msg, match) { return __awaiter(_this, void 0, void 0, function () {
    var chatId, adapter, db, chatData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.chat.id;
                adapter = new FileAsync_1.default('data.json');
                return [4 /*yield*/, lowdb_1.default(adapter)];
            case 1:
                db = _a.sent();
                chatData = db.get("broadcasting").find(function (item) { return item.chatId === chatId; }).value();
                if (chatData) {
                    db.get("broadcasting").remove(function (item) { return item.chatId === chatId; }).write().then(function () {
                        bot.sendMessage(msg.chat.id, "Broadcasting disabled for this channel.");
                    });
                }
                else
                    bot.sendMessage(msg.chat.id, "Channel is not registered for broadcasting.");
                return [2 /*return*/];
        }
    });
}); });
bot.onText(/\/enablebroadcast/, function (msg, match) { return __awaiter(_this, void 0, void 0, function () {
    var chatId, adapter, db;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.chat.id;
                adapter = new FileAsync_1.default('data.json');
                return [4 /*yield*/, lowdb_1.default(adapter)];
            case 1:
                db = _a.sent();
                if (db.get("broadcasting").find(function (item) { return item.chatId === chatId; }).value()) {
                    bot.sendMessage(msg.chat.id, "This channel is already configured to receive information about the loan.");
                    return [2 /*return*/];
                }
                db.get("broadcasting").push({ chatId: chatId }).write().then(function () {
                    bot.sendMessage(msg.chat.id, "Broadcasting of the loans enabled for this channel.");
                });
                return [2 /*return*/];
        }
    });
}); });
bot.onText(/\/unregister/, function (msg, match) { return __awaiter(_this, void 0, void 0, function () {
    var chatId, adapter, db, chatData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.chat.id;
                adapter = new FileAsync_1.default('data.json');
                return [4 /*yield*/, lowdb_1.default(adapter)];
            case 1:
                db = _a.sent();
                chatData = db.get("registrations").find(function (item) { return item.chatId === chatId; }).value();
                if (chatData) {
                    db.get("registrations").remove(function (item) { return item.chatId === chatId; }).write().then(function () {
                        bot.sendMessage(msg.chat.id, "You are not my subject anymore.");
                    });
                }
                else
                    bot.sendMessage(msg.chat.id, "I'm the lord of the loans, and you are not my subject. You can register by typing /register.");
                return [2 /*return*/];
        }
    });
}); });
bot.onText(/\/requests/, function (msg, match) { return __awaiter(_this, void 0, void 0, function () {
    var chatId, loans, msg_1, _i, loans_1, loan, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.chat.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetchAvailableLoans()];
            case 2:
                loans = _a.sent();
                if (loans.length === 0) {
                    bot.sendMessage(chatId, "All loans are funded right now.");
                    return [2 /*return*/];
                }
                msg_1 = "";
                for (_i = 0, loans_1 = loans; _i < loans_1.length; _i++) {
                    loan = loans_1[_i];
                    msg_1 += formatLoanData(loan);
                }
                msg_1 += "\n \n <b>Fund these requests and earn interest on </b> <a href=\"ethlend.io\">https://ethlend.io</a> \n \n \n";
                bot.sendMessage(chatId, msg_1, { parse_mode: "HTML" });
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.log(e_1);
                bot.sendMessage(chatId, "there was an error fetching the data of the latest loan requests. Please try again later.");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
    var adapter, db, currentList, difference, _loop_1, _i, difference_1, address;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapter = new FileAsync_1.default('data.json');
                return [4 /*yield*/, lowdb_1.default(adapter)];
            case 1:
                db = _a.sent();
                return [4 /*yield*/, marketplace.requests.getAllAddresses()];
            case 2:
                currentList = _a.sent();
                if (!latestLoansList) {
                    latestLoansList = currentList;
                    return [2 /*return*/];
                }
                if (!(currentList.length > latestLoansList.length)) return [3 /*break*/, 7];
                difference = currentList.filter(function (address) { return latestLoansList && !latestLoansList.includes(address); });
                _loop_1 = function (address) {
                    var loanData, message;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, marketplace.requests.getLoanData(address)];
                            case 1:
                                loanData = _a.sent();
                                message = "<b>NEW LOAN REQUEST</b> \n \n" + formatLoanData(loanData) + '<b>Fund this request and earn interest on </b> <a href="ethlend.io">https://ethlend.io</a> \n \n \n';
                                db.get("registrations").value().forEach(function (item) {
                                    try {
                                        bot.sendMessage(item.chatId, message, { parse_mode: "HTML" });
                                    }
                                    catch (e) {
                                        console.log("Exception while sending message to chat ", item.chatId, ", reason: ", e);
                                    }
                                });
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, difference_1 = difference;
                _a.label = 3;
            case 3:
                if (!(_i < difference_1.length)) return [3 /*break*/, 6];
                address = difference_1[_i];
                return [5 /*yield**/, _loop_1(address)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                latestLoansList = currentList;
                _a.label = 7;
            case 7: return [2 /*return*/];
        }
    });
}); }, 120000);
setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
    var adapter, db, loans;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapter = new FileAsync_1.default('data.json');
                return [4 /*yield*/, lowdb_1.default(adapter)];
            case 1:
                db = _a.sent();
                return [4 /*yield*/, fetchAvailableLoans()];
            case 2:
                loans = _a.sent();
                if (loans.length === 0)
                    return [2 /*return*/];
                db.get("broadcasting").value().forEach(function (item) {
                    var msg = '<b>AVAILABLE LOAN REQUESTS</b> \n\n\n\n';
                    for (var _i = 0, loans_2 = loans; _i < loans_2.length; _i++) {
                        var loan = loans_2[_i];
                        msg += formatLoanData(loan);
                    }
                    msg += "\n \n <b>Fund these requests and earn interest on </b> <a href=\"ethlend.io\">https://ethlend.io</a> \n \n \n";
                    try {
                        bot.sendMessage(item.chatId, msg, { parse_mode: "HTML" });
                    }
                    catch (e) {
                        console.log("Exception while sending message to chat ", item.chatId, ", reason: ", e);
                    }
                });
                return [2 /*return*/];
        }
    });
}); }, 7200000);

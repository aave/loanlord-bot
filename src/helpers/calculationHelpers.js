"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
exports.calculateTotalPremium = function (loanData) {
    if (!loanData.mpr || !loanData.loanAmount || !loanData.duration)
        return null;
    var installmentAmount = exports.calculateInstallmentAmount(loanData);
    if (!installmentAmount)
        return null;
    var decimalPlaces = loanData && loanData.isPeggedLoan ? 2 : 6;
    return new bignumber_js_1.default(installmentAmount).multipliedBy(loanData.duration).minus(loanData.loanAmount).decimalPlaces(decimalPlaces, bignumber_js_1.default.ROUND_UP);
};
exports.calculateInstallmentAmount = function (loanData) {
    /********
     * IMPORTANT
     *
     * Interest is calculated using the fixed rate mortgage formula:
     * https://en.wikipedia.org/wiki/Fixed-rate_mortgage
     *
     *******/
    if (!loanData.mpr || !loanData.loanAmount || !loanData.duration)
        return null;
    var mprNormalized = new bignumber_js_1.default(loanData.mpr).dividedBy(100);
    var firstTerm = mprNormalized
        .plus(1)
        .pow(loanData.duration);
    var secondTerm = mprNormalized.dividedBy(firstTerm.minus(1));
    return new bignumber_js_1.default(loanData.loanAmount)
        .multipliedBy(firstTerm)
        .multipliedBy(secondTerm)
        .decimalPlaces(6, bignumber_js_1.default.ROUND_UP);
};

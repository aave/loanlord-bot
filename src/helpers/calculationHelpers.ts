import { LoanRequestModel } from "aave-js/dist/types/types";
import BigNumber from 'bignumber.js';

export const calculateTotalPremium = (loanData : LoanRequestModel) => {


    if (!loanData.mpr || !loanData.loanAmount || !loanData.duration)
        return null;

    let installmentAmount = calculateInstallmentAmount(loanData);
  
    if(!installmentAmount) return null;

    let decimalPlaces = (loanData as LoanRequestModel) && (<LoanRequestModel>loanData).isPeggedLoan ? 2 : 6;

    return new BigNumber(installmentAmount).multipliedBy(loanData.duration).minus(loanData.loanAmount).decimalPlaces(decimalPlaces, BigNumber.ROUND_UP);
}


export const calculateInstallmentAmount = (loanData : LoanRequestModel ) => {

    /********
     * IMPORTANT
     * 
     * Interest is calculated using the fixed rate mortgage formula:
     * https://en.wikipedia.org/wiki/Fixed-rate_mortgage
     * 
     *******/

    if (!loanData.mpr || !loanData.loanAmount || !loanData.duration)
        return null;

    let mprNormalized = new BigNumber(loanData.mpr).dividedBy(100);

    let firstTerm = mprNormalized
        .plus(1)
        .pow(loanData.duration);

    let secondTerm = mprNormalized.dividedBy(firstTerm.minus(1));

    return new BigNumber(loanData.loanAmount)
        .multipliedBy(firstTerm)
        .multipliedBy(secondTerm)
        .decimalPlaces(6, BigNumber.ROUND_UP);

}

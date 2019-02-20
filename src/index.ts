import TelegramBot from 'node-telegram-bot-api';
import {Marketplace} from 'aave-js';
import { LoanRequestModel } from 'aave-js/dist/types/types';


const token = '';

const bot = new TelegramBot(token, {polling: true});

const marketplace = new Marketplace('');

const formatLoanData = (data : LoanRequestModel) => {

    let message = `<b>Loan request address</b> \n ${data.loanAddress} \n \n`;
    message +=`<b>collateral:</b> ${data.collateralAmount} ${data.collateralType} \n`;
    message +=`<b>loan amount:</b> ${data.loanAmount} ${data.moe} \n`;
    message +=`<b>Monthly interest:</b> ${data.mpr}% \n`;
    message +=`<b>Duration:</b> ${data.duration} days \n \n \n`;

    message +=`<b>Fund this request and earn interest on </b> <a href="ethlend.io">https://ethlend.io</a> \n \n \n`;

    return message;
}

bot.onText(/\/requests/, async(msg : any, match : any) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;

  try {

  const allRequestsAddresses = await marketplace.requests.getAllAddresses();

  for(let address of allRequestsAddresses){

    let loanData = await marketplace.requests.getLoanData(address);
    let message=formatLoanData(loanData);

    bot.sendMessage(chatId, message ,{parse_mode : "HTML"});

  }
  
} catch(e){
    console.log(e);
    bot.sendMessage(chatId, "there was an error fetching the data of the latest loan requests. Please try again later.");
} 
  
});


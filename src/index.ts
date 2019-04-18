import TelegramBot from 'node-telegram-bot-api';
import { Marketplace } from 'aave-js';
import { LoanRequestModel } from 'aave-js/dist/types/types';
import lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';
import { calculateTotalPremium } from './helpers/calculationHelpers';
import BigNumber from 'bignumber.js'

const token = '';

const bot = new TelegramBot(token, { polling: true });

const marketplace = new Marketplace('', 'https://api.aave.com');

let latestLoansList: string[] | null = null;


const formatLoanData = (data: LoanRequestModel) => {

  const totalPremium = calculateTotalPremium(data);
 
  const apr = totalPremium ? totalPremium.dividedBy(data.loanAmount).multipliedBy(100).toFixed(2) : 0;

  let message = `<b>----- LOAN REQUEST ------</b> \n\n Address: \n <b>${data.loanAddress}</b> \n`;
  message += `Collateral:<b> ${data.collateralAmount} ${data.collateralType} </b> \n`;
  message += `Loan amount:<b> ${data.loanAmount} ${data.moe} </b> \n`;
  message += `APR: <b>${apr}%</b> \n`;
  message += `Duration: <b>${data.duration * 30} days</b> \n`;
  message += totalPremium ? `<b>POTENTIAL EARNINGS: ${totalPremium.toString()} ${data.moe}</b>  \n \n `: "";

  return message;
}


const fetchAvailableLoans = async (): Promise<LoanRequestModel[]> => {

  const allRequestsAddresses = await marketplace.requests.getAllAddresses();

  let loans = [];

  for (let address of allRequestsAddresses.reverse()) {

    let loanData = await marketplace.requests.getLoanData(address);

    if (loanData.state && loanData.state.toLowerCase() === "funding") {
      loans.push(loanData);
    }

  }
  return loans;
}

bot.onText(/\/whoisthelord/, (msg: any, match: any) => {

  let message = "I'm the lords of the loans, built with the AAVE SDK, and i rule over the ETHLend world. \n";
  message += "If you want to become my subject, write to me in private and type <b>/register</b>. You shall receive notifications when i consider it appropriate.";
  message += " Type <b>/requests</b> if you want to know which loans are available on the platform to fund.";
  message += "I shall acquire more power as the AAVE SDK grows.";

  bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });

});

bot.onText(/\/register/, async (msg: any, match: any) => {

  const chatId = msg.chat.id;

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);

  if (db.get("registrations").find(item => item.chatId === chatId).value()) {
    bot.sendMessage(msg.chat.id, "This channel is already registered to receive loan notifications. If you want to receive personal notification, send the /register command in private.");
    return;
  }

  db.get("registrations").push({ chatId: chatId }).write().then(() => {

    bot.sendMessage(msg.chat.id, "I now bless you with the power of the ETHLend API.");

  });

});

bot.onText(/\/disablebroadcast/, async (msg: any, match: any) => {

  const chatId = msg.chat.id;

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);

  let chatData = db.get("broadcasting").find(item => item.chatId === chatId).value();

  if (chatData) {

    db.get("broadcasting").remove((item: any) => item.chatId === chatId).write().then(() => {
      bot.sendMessage(msg.chat.id, "Broadcasting disabled for this channel.");

    });
  }
  else
    bot.sendMessage(msg.chat.id, "Channel is not registered for broadcasting.");


});

bot.onText(/\/enablebroadcast/, async (msg: any, match: any) => {

  const chatId = msg.chat.id;

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);

  if (db.get("broadcasting").find(item => item.chatId === chatId).value()) {
    bot.sendMessage(msg.chat.id, "This channel is already configured to receive information about the loan.");
    return;
  }

  db.get("broadcasting").push({ chatId: chatId }).write().then(() => {

    bot.sendMessage(msg.chat.id, "Broadcasting of the loans enabled for this channel.");

  });

});


bot.onText(/\/unregister/, async (msg: any, match: any) => {

  const chatId = msg.chat.id;

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);

  let chatData = db.get("registrations").find(item => item.chatId === chatId).value();



  if (chatData) {

    db.get("registrations").remove((item: any) => item.chatId === chatId).write().then(() => {
      bot.sendMessage(msg.chat.id, "You are not my subject anymore.");

    });
  }
  else
    bot.sendMessage(msg.chat.id, "I'm the lord of the loans, and you are not my subject. You can register by typing /register.");

});



bot.onText(/\/requests/, async (msg: any, match: any) => {

  const chatId = msg.chat.id;

  try {


    let loans = await fetchAvailableLoans();

    if (loans.length === 0) {
      bot.sendMessage(chatId, "All loans are funded right now.");
      return;
    }

    let msg: string = "";

    for (let loan of loans) {
      msg += formatLoanData(loan);
    }

    msg += `\n \n <b>Fund these requests and earn interest on </b> <a href="ethlend.io">https://ethlend.io</a> \n \n \n`;

    bot.sendMessage(chatId, msg, { parse_mode: "HTML" });

  } catch (e) {
    console.log(e);
    bot.sendMessage(chatId, "there was an error fetching the data of the latest loan requests. Please try again later.");
  }

});


setInterval(async () => {

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);


  const currentList = await marketplace.requests.getAllAddresses();

  if (!latestLoansList) {
    latestLoansList = currentList;
    return;
  }

  if (currentList.length > latestLoansList.length) {

    let difference = currentList.filter((address: string) => latestLoansList && !latestLoansList.includes(address));

    for (let address of difference) {

      let loanData = await marketplace.requests.getLoanData(address);
      let message = "<b>NEW LOAN REQUEST</b> \n \n" + formatLoanData(loanData) + '<b>Fund this request and earn interest on </b> <a href="ethlend.io">https://ethlend.io</a> \n \n \n';

      db.get("registrations").value().forEach((item: any) => {

        try {
          bot.sendMessage(item.chatId, message, { parse_mode: "HTML" });
        }
        catch (e) {
          console.log("Exception while sending message to chat ", item.chatId, ", reason: ", e);
        }

      });

    }

    latestLoansList = currentList;

  }


}, 120000);


setInterval(async () => {

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);

  let loans = await fetchAvailableLoans();

  if(loans.length === 0) return;

  db.get("broadcasting").value().forEach((item: any) => {

    let msg = '<b>AVAILABLE LOAN REQUESTS</b> \n\n\n\n';

    for (let loan of loans) {
      msg += formatLoanData(loan);
    }

    msg += `\n \n <b>Fund these requests and earn interest on </b> <a href="ethlend.io">https://ethlend.io</a> \n \n \n`;

    try {
      bot.sendMessage(item.chatId, msg, { parse_mode: "HTML" });
    }
    catch (e) {
      console.log("Exception while sending message to chat ", item.chatId, ", reason: ", e);
    }


  });


}, 7200000);


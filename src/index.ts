import TelegramBot from 'node-telegram-bot-api';
import { Marketplace } from 'aave-js';
import { LoanRequestModel } from 'aave-js/dist/types/types';
import lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';


const token = '667101294:AAEoXmSqMJV11CROGXs8f7fDg_keo3HFQ0k';

const bot = new TelegramBot(token, { polling: true });

const marketplace = new Marketplace('');

let latestLoansList : string[] | null = null;


const formatLoanData = (data: LoanRequestModel) => {

  let message = `Loan request address: \n <b>${data.loanAddress}</b> \n \n`;
  message += `collateral:<b> ${data.collateralAmount} ${data.collateralType} </b> \n`;
  message += `loan amount:<b> ${data.loanAmount} ${data.moe} </b> \n`;
  message += `Monthly interest: <b>${data.mpr}%</b> \n`;
  message += `Duration: <b>${data.duration*30} days</b> \n \n \n`;

  message += `<b>Fund this request and earn interest on </b> <a href="ethlend.io">https://ethlend.io</a> \n \n \n`;

  return message;
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
    bot.sendMessage(msg.chat.id, "You already registered with the lord of the loans.");
    return;
  }

  db.get("registrations").push({ chatId: chatId }).write().then(() => {

    bot.sendMessage(msg.chat.id, "I now bless you with the power of the ETHLend API.");

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

    const allRequestsAddresses = await marketplace.requests.getAllAddresses();

    let loansFound = 0;


    for (let address of allRequestsAddresses.reverse()) {

      let loanData = await marketplace.requests.getLoanData(address);
    
      if(loanData.state && loanData.state.toLowerCase() === "funding"){

        let message = formatLoanData(loanData);
        bot.sendMessage(chatId, message, { parse_mode: "HTML" });
        loansFound++;
      }


    }

    if(loansFound == 0){
       bot.sendMessage(chatId, "All loans are funded right now.");
    }

  } catch (e) {
    console.log(e);
    bot.sendMessage(chatId, "there was an error fetching the data of the latest loan requests. Please try again later.");
  }

});


setInterval(async () => {

  const adapter = new FileAsync('data.json')
  const db = await lowdb(adapter);


  const currentList = await marketplace.requests.getAllAddresses();
  
  if(!latestLoansList){
    latestLoansList = currentList;
    return;
  }

  if(currentList.length > latestLoansList.length){
    
    let difference =  currentList.filter( address =>  latestLoansList && !latestLoansList.includes(address));
    
    for (let address of difference) {

      let loanData = await marketplace.requests.getLoanData(address);
      let message = "<b>NEW LOAN REQUEST</b> \n \n" + formatLoanData(loanData);

      db.get("registrations").value().forEach( (item : any) => {

        bot.sendMessage(item.chatId, message, { parse_mode: "HTML" });
 
      });

    }

    latestLoansList = currentList;
    
  }


}, 6000);

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const path = require('path');
const fs = require('fs');

const { enter, leave } = Stage;

const SEARCH_FOR_CAR = '🚕 Search for a car';
const SETTINGS = '⚙️ Settings';

const FROM = '⬆️️ From:';
const TO = '⬇️ To:';

const BACK_TO_MENU = '🔙 Back to menu';
const BACK_TO_FROM = '🤫 Change from';
const BACK_TO_TO = '🤫 Change to';

const OK = '👌 Okay';

// Greeter scene
const menuScene = new Scene('menu');
menuScene.enter((ctx) => {
  console.log('session', ctx.session);

  return ctx.reply(
    `Hey, ${ctx.chat.first_name}! Ready to ride? 🚕`,
    Markup
      .keyboard([
        [SEARCH_FOR_CAR, /*SETTINGS*/],
      ])
      .oneTime()
      .resize()
      .extra(),
    );
});
// menuScene.leave((ctx) => ctx.reply('Bye'));
menuScene.hears(SEARCH_FOR_CAR, enter('from'));
// menuScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'));


const fromScene = new Scene('from');
fromScene.enter((ctx) => {
  console.log('session', ctx.session);

  ctx.replyWithPhoto({
    source: fs.createReadStream(path.join(__dirname, './location.jpg'))},
    // {caption: '132' }
  );

  return ctx.reply(
    `Choose the location from 🌏`,
    Markup
      .keyboard([
        [BACK_TO_MENU],
      ])
      .oneTime()
      .resize()
      .extra(),
    );
});
fromScene.on('location', (ctx) => {
  const {latitude, longitude} = ctx.message.location;

  ctx.session.from = [latitude, longitude];

  return ctx.scene.enter('to');
});

const toScene = new Scene('to');
toScene.enter((ctx) => {
  console.log('session', ctx.session);

  return ctx.reply(
    `Alright, now choose where you want to go 🏁`,
    Markup
      .keyboard([
        [BACK_TO_FROM],
        [BACK_TO_MENU],
      ])
      .oneTime()
      .resize()
      .extra(),
  );
});
toScene.hears(BACK_TO_FROM, (ctx) => ctx.scene.enter('from'));
toScene.on('location', (ctx) => {
  const {latitude, longitude} = ctx.message.location;

  ctx.session.to = [latitude, longitude];

  return ctx.scene.enter('search');
});

const searchScene = new Scene('search');
searchScene.enter((ctx) => {
  console.log('session', ctx.session);

  return ctx.reply(
    `Nice, I'm ready to find a car, proceed?`,
    Markup
      .keyboard([
        [OK],
        [BACK_TO_FROM, BACK_TO_TO],
        [BACK_TO_MENU],
      ])
      .oneTime()
      .resize()
      .extra(),
  );
});
searchScene.hears(BACK_TO_FROM, (ctx) => ctx.scene.enter('from'));



const bot = new Telegraf("1160141854:AAFVuyIUol5VLCWKl1a17vge2LRN0OOHoRc");
const stage = new Stage([
  menuScene,
  fromScene,
  toScene,
  searchScene,
], { ttl: 60 });

bot.use(Telegraf.log());
bot.use(session());
bot.use(stage.middleware())

bot.start((ctx) => {
  console.log(ctx.session);
  ctx.scene.enter('menu');
});

bot.hears(BACK_TO_MENU, (ctx) => ctx.scene.enter('menu'));

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
  console.log(JSON.stringify(err), err);
});

bot.launch();

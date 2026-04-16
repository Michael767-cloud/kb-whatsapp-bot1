const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MENU_GREETING = "Hi, I'm KB'S AI Assistant! How can I help you please? Click on a number to start:\n\n💬 Chat with KB\n\n⚡ My Vibes\n\n📸 About KB\n\n🤖 Ask Gemini AI";
const OPTION_1_REPLY = "KB is chilling right now but leave a message here and he'll hit you up later! ✌️";
const OPTION_2_REPLY = "I'm KB, born June 30, 2005. I'm really into tech and exploring new gadgets. Most of my time is spent hanging with my best friends and looking for the next big thing! 🚀";
const OPTION_3_IMAGE_URL = 'https://i.imgur.com/3GvwNBf.jpeg';
const OPTION_3_CAPTION = "This is KB! He's the mastermind behind this bot. 😎";
const OPTION_4_PROMPT = "Send your message starting with 'AI' (example: AI tell me a fun fact), and I'll ask Gemini for you.";

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('KB WhatsApp bot is ready!');
});

async function generateGeminiReply(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return "Gemini API key is not configured. Please set GEMINI_API_KEY.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);

  return result.response.text();
}

async function handleMessage(msg) {
  const text = msg.body.trim();
  const normalized = text.toLowerCase();

  if (normalized === 'hi' || normalized === 'yo' || normalized === 'menu') {
    await msg.reply(MENU_GREETING);
    return;
  }

  if (text === '1') {
    await msg.reply(OPTION_1_REPLY);
    return;
  }

  if (text === '2') {
    await msg.reply(OPTION_2_REPLY);
    return;
  }

  if (text === '3') {
    try {
      const media = await MessageMedia.fromUrl(OPTION_3_IMAGE_URL);
      await client.sendMessage(msg.from, media, { caption: OPTION_3_CAPTION });
    } catch (error) {
      console.error('Failed to send profile image:', error.message);
      await msg.reply('Sorry, I could not load KB\'s image right now.');
    }
    return;
  }

  if (text === '4') {
    await msg.reply(OPTION_4_PROMPT);
    return;
  }

  if (/^ai\b/i.test(text)) {
    const prompt = text.slice(2).trim();

    if (!prompt) {
      await msg.reply("Please add a prompt after 'AI'. Example: AI explain quantum computing simply.");
      return;
    }

    try {
      const aiReply = await generateGeminiReply(prompt);
      await msg.reply(aiReply);
    } catch (error) {
      console.error('Gemini request failed:', error.message);
      await msg.reply('Sorry, I could not get a response from Gemini right now.');
    }
  }
}

client.on('message', async (msg) => {
  await handleMessage(msg);
});

client.initialize();

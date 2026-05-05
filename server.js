import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { google } from 'googleapis';

// ESM 환경에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

dotenv.config();

// [수정] Vercel 환경 변수 대응 구글 시트 인증 설정
const envCredentials = process.env.GOOGLE_CREDENTIALS;

if (!envCredentials) {
  console.error("에러: Vercel Settings에서 GOOGLE_CREDENTIALS 환경 변수를 찾을 수 없습니다.");
}

// JSON 파싱 및 Vercel에서 깨지는 줄바꿈(\n) 복구
const credentials = JSON.parse(envCredentials);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const spreadsheetId = process.env.SPREADSHEET_ID;

// 서비스 파일들도 ESM 방식으로 불러와야 합니다 (확장자 .js 필수)
import * as codeStore from './services/code-store.js';
import { checkMessageExists } from './services/octomo.client.js';

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4자리 코드 생성 함수
function generateFourDigitCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return String(n);
}

// 구글 시트에 데이터를 저장하는 함수
async function saveToSheet(formData) {
  const sheets = google.sheets({ version: 'v4', auth });
  
  const rowData = [
    new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), 
    formData.name,       
    formData.contact,    
    formData.discord,    
    formData.roblox,     
    formData.privacyAgreed ? '동의' : '미동의', 
    formData.termsAgreed ? '동의' : '미동의',   
    formData.isMinor ? '해당' : '미해당',       
    formData.guardian ? formData.guardian.name : '-',         
    formData.guardian ? formData.guardian.contact : '-',      
    formData.guardian ? formData.guardian.relationship : '-'  
  ];

  try {
    const resMain = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '구매자 기록부!B4:B18', 
    });
    const nextRowMain = (resMain.data.values || []).length + 4;

    if (nextRowMain <= 18) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `구매자 기록부!B${nextRowMain}:L${nextRowMain}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [rowData] },
      });
      console.log(`✅ 구매자 기록부 ${nextRowMain}행 기록 완료`);
    }

    if (formData.isMinor === true) {
      const resMinor = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: '미성년자 관리!B4:B100',
      });
      const nextRowMinor = (resMinor.data.values || []).length + 4;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `미성년자 관리!B${nextRowMinor}:L${nextRowMinor}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [rowData] },
      });
      console.log(`💖 미성년자 관리 시트 ${nextRowMinor}행 추가 기록 완료`);
    }
  } catch (err) {
    console.error('❌ 시트 저장 오류:', err.message);
  }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/complete', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'complete.html'));
});

// Discord 웹훅 전송 함수
async function sendToDiscord(formData) {
  if (!process.env.DISCORD_WEBHOOK_URL) return false;

  try {
    const embed = {
      title: '새로운 정책 동의서',
      color: 0x00ff00,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '구매자 정보',
          value: `**성함:** ${formData.name}\n**연락처:** ${formData.contact}\n**디스코드:** ${formData.discord}\n**로블록스:** ${formData.roblox}`,
          inline: false
        },
        {
          name: '동의 상태',
          value: `**개인정보 동의:** ${formData.privacyAgreed ? '✅' : '❌'}\n**약관 동의:** ${formData.termsAgreed ? '✅' : '❌'}\n**만 14세 미만:** ${formData.isMinor ? '✅' : '❌'}`,
          inline: true
        }
      ],
      footer: { text: '제출 시간' }
    };

    if (formData.isMinor && formData.guardian) {
      embed.fields.push({
        name: '법정대리인 정보',
        value: `**성명:** ${formData.guardian.name}\n**연락처:** ${formData.guardian.contact}\n**관계:** ${formData.guardian.relationship}`,
        inline: false
      });
    }

    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      username: '정책 동의서 봇',
      embeds: [embed]
    });

    return true;
  } catch (error) {
    console.error('Discord webhook error:', error.message);
    return false;
  }
}

app.post('/submit', async (req, res) => {
    const formData = req.body;
    try {
      await sendToDiscord(formData);
      await saveToSheet(formData); 
      res.json({ success: true, message: '제출이 완료되었습니다.' });
    } catch (error) {
      res.status(500).json({ success: false, message: '오류가 발생했습니다.' });
    }
});

app.post('/api/auth/issue-code', (req, res) => {
  const phoneNumber = req.body?.phoneNumber;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required' });

  const code = generateFourDigitCode();
  codeStore.set(phoneNumber.trim(), code);
  res.json({ code });
});

app.post('/api/auth/verify', async (req, res) => {
  const phoneNumber = req.body?.phoneNumber;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required', verified: false });

  const trimmed = phoneNumber.trim();
  const code = codeStore.get(trimmed);
  if (!code) return res.status(400).json({ error: 'No code found', verified: false });

  try {
    const exists = await checkMessageExists(trimmed, code);
    res.json({ verified: exists });
  } catch (err) {
    res.status(500).json({ error: 'Phone verification failed' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
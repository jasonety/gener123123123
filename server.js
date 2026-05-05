const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const { google } = require('googleapis'); // [추가] 구글 API 라이브러리

const app = express();
const PORT = 80;

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
  credentials, // 파일 경로 대신 가공된 데이터를 직접 넣음
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
});
const spreadsheetId = process.env.SPREADSHEET_ID;

const codeStore = require('./services/code-store');
const { checkMessageExists } = require('./services/octomo.client');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4자리 코드 생성 함수
function generateFourDigitCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return String(n);
}

// [추가] 구글 시트에 데이터를 저장하는 함수
async function saveToSheet(formData) {
  const sheets = google.sheets({ version: 'v4', auth });
  
  // 데이터 배열 생성 (공통으로 사용)
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
    // 1. [기본] '구매자 기록부' 시트에 저장 (기존 로직)
    const resMain = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '구매자 기록부!B4:B18', // 탭 이름 확인 필수!
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

    // 2. [추가] 만 14세 미만인 경우 '미성년자 관리' 시트에 추가 저장
    if (formData.isMinor === true) {
      // 미성년자 시트의 빈 줄을 찾습니다. (마찬가지로 4행부터 시작한다고 가정)
      const resMinor = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: '미성년자 관리!B4:B100', // 미성년자 시트 범위
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
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook URL not configured');
    return false;
  }

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
      footer: {
        text: '제출 시간'
      }
    };

    if (formData.isMinor && formData.guardian) {
      embed.fields.push({
        name: '법정대리인 정보',
        value: `**성명:** ${formData.guardian.name}\n**연락처:** ${formData.guardian.contact}\n**관계:** ${formData.guardian.relationship}`,
        inline: false
      });
    }

    const payload = {
      username: '정책 동의서 봇',
      embeds: [embed]
    };

    await axios.post(process.env.DISCORD_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('Discord webhook sent successfully');
    return true;
  } catch (error) {
    console.error('Discord webhook error:', error.message);
    return false;
  }
}

app.post('/submit', async (req, res) => {
    const formData = req.body;
    console.log('Received form data:', formData);

    try {
      // 1. Discord 웹훅으로 전송
      const discordSent = await sendToDiscord(formData);
      
      // 2. [추가] 구글 시트로 전송;
      await saveToSheet(formData); 
      
      if (discordSent) {
        console.log('Form data sent to Discord successfully');
      } else {
        console.log('Failed to send to Discord, but continuing with submission');
      }
      
      res.json({ success: true, message: '감사합니다. 제출이 완료되었습니다.' });
    } catch (error) {
      console.error('Submission error:', error);
      res.status(500).json({ success: false, message: '제출 중 오류가 발생했습니다.' });
    }
});

// 인증 코드 발급 엔드포인트 (기존 로직 유지)
app.post('/api/auth/issue-code', (req, res) => {
  const phoneNumber = req.body?.phoneNumber;
  if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    console.log('Code issue failed: phoneNumber is required');
    res.status(400).json({ error: 'phoneNumber is required' });
    return;
  }

  const code = generateFourDigitCode();
  codeStore.set(phoneNumber.trim(), code);
  console.log('Code issued for', phoneNumber.trim(), ':', code);
  res.json({ code });
});

// 전화번호 인증 엔드포인트 (기존 로직 유지)
app.post('/api/auth/verify', async (req, res) => {
  const phoneNumber = req.body?.phoneNumber;
  if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    res.status(400).json({ error: 'phoneNumber is required', verified: false });
    return;
  }

  const trimmed = phoneNumber.trim();
  const code = codeStore.get(trimmed);

  if (!code) {
    console.log('Verification failed: No code found for', trimmed);
    res.status(400).json({ error: 'No verification code found', verified: false });
    return;
  }

  try {
    const exists = await checkMessageExists(trimmed, code);
    console.log('Verification result for', trimmed, ':', exists ? 'SUCCESS' : 'FAILED');
    res.json({ verified: exists });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Octomo verify error for', trimmed, ':', message);
    res.status(500).json({ error: 'Phone verification failed' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
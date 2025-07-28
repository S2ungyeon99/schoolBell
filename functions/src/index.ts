// functions/src/index.ts
import vision from "@google-cloud/vision";
import * as dotenv from "dotenv";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { htmlToText } from "html-to-text";
import OpenAI from "openai";

dotenv.config();
admin.initializeApp();

const expo = new Expo();
const visionClient = new vision.ImageAnnotatorClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface Notice {
  nttId: string;
  id?: string;
  subject: string;
  content?: string;
  regDate: string;
  imageUrls?: string[];
  timestamp?: FirebaseFirestore.Timestamp;
  [key: string]: any;
}

interface UserData {
  expoPushToken?: string;
  department?: string;
  keywords?: string[];
}

const plainText = (html?: string): string =>
  htmlToText(html || "", {
    wordwrap: false,
    selectors: [
      { selector: "table", format: "skip" },
      { selector: "tr", format: "block" },
      { selector: "td", format: "block" },
    ],
  });

// OCR: 이미지에서 텍스트 추출
const extractTextFromImages = async (imageUrls: string[]): Promise<string> => {
  try {
    let combinedText = "";
    for (const url of imageUrls) {
      const [result] = await visionClient.textDetection(url);
      const detections = result.textAnnotations || [];
      if (detections.length > 0) {
        combinedText += detections[0].description + "\n";
      }
    }
    return combinedText.trim();
  } catch (err) {
    console.error("OCR 실패:", err);
    return "";
  }
};

const summarize = async (text: string, fallback: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "공지문을 2~3문장으로 간결하게 요약해 주세요." },
        { role: "user", content: text },
      ],
      temperature: 0.5,
      max_tokens: 120,
    });
    return completion.choices[0].message?.content?.trim() ?? fallback;
  } catch (err) {
    console.error("요약 실패:", err);
    return fallback;
  }
};

const sendPush = async (
  tokens: string[],
  title: string,
  summary: string,
  data: Record<string, any>
): Promise<void> => {
  if (!tokens.length) return;
  const body = !summary || summary === title ? "공지 내용을 확인해 주세요." : summary;
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const result = await expo.sendPushNotificationsAsync(chunk);
      console.log("푸시 전송 결과:", result);
    } catch (err) {
      console.error("푸시 전송 실패:", err);
    }
  }
};

const processDept = async (): Promise<void> => {
  const deptSnap = await admin.firestore().collection("department").get();
  for (const deptDoc of deptSnap.docs) {
    const deptId = deptDoc.id;
    const apiUrl = (deptDoc.data() as any).apiUrl as string;
    const lastRef = admin.firestore().collection("lastFetched").doc(deptId);
    const lastSnap = await lastRef.get();
    let lastTimestamp: FirebaseFirestore.Timestamp | null =
      lastSnap.exists ? (lastSnap.data()?.lastTimestamp as FirebaseFirestore.Timestamp) : null;

    try {
      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        console.error(`Dept ${deptId} API 오류:`, resp.statusText);
        continue;
      }
      const notices = (await resp.json()) as Notice[];

      for (const notice of notices) {
        if (!notice.regDate) continue;
        const ts = admin.firestore.Timestamp.fromDate(
          new Date(notice.regDate.replace(" ", "T"))
        );
        if (lastTimestamp && ts.toMillis() <= lastTimestamp.toMillis()) continue;

        notice.timestamp = ts;
        const docRef = admin
          .firestore()
          .doc(`notices/${deptId}/deptNotices/${notice.nttId}`);
        if ((await docRef.get()).exists) continue;

        await docRef.set(notice);
        console.log(`Dept ${deptId} 새 공지: ${notice.nttId}`);

        // HTML + 이미지 OCR
        let snippet = plainText(notice.content || notice.subject);
        if (notice.imageUrls && Array.isArray(notice.imageUrls) && notice.imageUrls.length > 0) {
          const ocrText = await extractTextFromImages(notice.imageUrls);
          snippet += "\n" + ocrText;
        }
        const summary = await summarize(snippet, notice.subject);

        const usersSnap = await admin
          .firestore()
          .collection("users")
          .where("department", "==", deptId)
          .get();
        const tokens = usersSnap.docs
          .map((d) => (d.data() as UserData).expoPushToken)
          .filter((t): t is string => Expo.isExpoPushToken(t));
        await sendPush(tokens, notice.subject, summary, {
          departmentId: deptId,
          noticeId: notice.nttId,
        });

        if (!lastTimestamp || ts.toMillis() > lastTimestamp.toMillis()) {
          lastTimestamp = ts;
        }
      }
      if (lastTimestamp) {
        await lastRef.set({ lastTimestamp });
      }
    } catch (err) {
      console.error(`Dept ${deptId} 처리 실패:`, err);
    }
  }
};

const processGlobal = async (): Promise<void> => {
  const noticeSnap = await admin.firestore().collection("notice").get();
  for (const docSnap of noticeSnap.docs) {
    const noticeType = docSnap.id;
    const apiUrl = (docSnap.data() as any).apiUrl as string;
    const collectionPath = {
      hbLive: "notices_hbLive",
      scholarship: "notices_scholarship",
      school: "notices_school",
    }[noticeType];
    if (!collectionPath) continue;

    const globalLastRef = admin.firestore().collection("lastFetchedGlobal").doc(noticeType);
    const globalLastSnap = await globalLastRef.get();
    let lastGlobalTimestamp: FirebaseFirestore.Timestamp | null =
      globalLastSnap.exists
        ? (globalLastSnap.data()?.lastTimestamp as FirebaseFirestore.Timestamp)
        : null;

    try {
      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        console.error(`${noticeType} API 오류:`, resp.statusText);
        continue;
      }
      const notices = (await resp.json()) as Notice[];

      for (const notice of notices) {
        if (!notice.regDate) continue;
        const ts = admin.firestore.Timestamp.fromDate(
          new Date(notice.regDate.replace(" ", "T"))
        );
        if (lastGlobalTimestamp && ts.toMillis() <= lastGlobalTimestamp.toMillis()) continue;

        notice.timestamp = ts;
        const noticeId = notice.nttId || notice.id!;
        const noticeRef = admin.firestore().doc(`${collectionPath}/${noticeId}`);
        if ((await noticeRef.get()).exists) continue;

        await noticeRef.set(notice);
        console.log(`${noticeType} 새 공지: ${noticeId}`);

        // HTML + 이미지 OCR
        let snippet = plainText(notice.content || notice.subject);
        if (notice.imageUrls && Array.isArray(notice.imageUrls) && notice.imageUrls.length > 0) {
          const ocrText = await extractTextFromImages(notice.imageUrls);
          snippet += "\n" + ocrText;
        }
        const summary = await summarize(snippet, notice.subject);

        const usersSnap = await admin.firestore().collection("users").get();
        const tokens: string[] = [];
        for (const userDoc of usersSnap.docs) {
          const { expoPushToken, keywords = [] } = userDoc.data() as UserData;
          if (expoPushToken && Expo.isExpoPushToken(expoPushToken)) {
            if (
              keywords.some((kw) =>
                (notice.subject || "").toLowerCase().includes(kw.toLowerCase())
              )
            ) {
              tokens.push(expoPushToken);
            }
          }
        }
        await sendPush(tokens, notice.subject, summary, {
          noticeType,
          noticeId,
        });

        if (!lastGlobalTimestamp || ts.toMillis() > lastGlobalTimestamp.toMillis()) {
          lastGlobalTimestamp = ts;
        }
      }
      if (lastGlobalTimestamp) {
        await globalLastRef.set({ lastTimestamp: lastGlobalTimestamp });
      }
    } catch (err) {
      console.error(`${noticeType} 처리 오류:`, err);
    }
  }
};

export const fetchNotices = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
  },
  async () => {
    await processDept();
    await processGlobal();
  }
);

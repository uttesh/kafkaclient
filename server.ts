import express from "express";
import { Kafka } from "kafkajs";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string;
  value: string;
  timestamp: string;
}

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const kafka = new Kafka({
  clientId: "kafka-dashboard",
  brokers: ["localhost:9092"] // Change as per your setup
});

const admin = kafka.admin(); // Create an admin client
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "kafka-dashboard-group" });

// Store messages in memory (or use a database for persistence)
let messages: any[] = [];
let onlyOnce = true;
let isConsumerRunning = false;

const fetchAllTopics = async () => {
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  await admin.disconnect();
  return topics;
};

const fetchLatestMessages = async () => {
  try {
    if (isConsumerRunning) {
      console.warn("⚠️ Consumer is already running, skipping re-run...");
      // await consumer.disconnect();
      return;
    }
    if (onlyOnce) {
      console.log("its should call only once");
      const topics = await fetchAllTopics();
      await consumer.connect();
      for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
      }
    }
    onlyOnce = false;
    isConsumerRunning = true;
    console.log("🔄 Polling latest messages...");

    let fetchedMessages: any[] = [];

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const msgValue = message.value?.toString();
        const msgKey = message.key?.toString() || "N/A";
        const offset = message.offset;
        const timestamp = new Date(Number(message.timestamp)).toLocaleString();
        console.log("📥 RECEIVED MESSAGE:", {
          topic,
          partition,
          key: message.key?.toString(),
          value: message.value?.toString(),
          offset: message.offset
        });
        messages.push({
          topic,
          partition,
          key: message.key?.toString() || "N/A",
          value: message.value?.toString(),
          offset: message.offset
        });
        console.log("messages in consumer list....", messages);
      }
    });

    if (fetchedMessages.length > 0) {
      console.log("push the messages to the list....");
      messages = fetchedMessages.slice(-50); // Keep only the last 50 messages
      console.log("✅ Updated messages:", messages.length);
    }
  } catch (error) {
    console.error("❌ Error fetching latest messages:", error);
  }
};

// Poll messages every 5 seconds
setInterval(fetchLatestMessages, 5000);

app.post("/publish", async (req, res) => {
  try {
    const { topic, key, message } = req.body;
    if (!topic || !message) {
      console.error("❌ Missing topic or message:", req.body);
      res.status(400).json({ error: "Topic and message are required" });
    }
    console.log("🚀 Connecting to Kafka Producer...");
    await producer.connect();
    console.log("✅ Producer connected!");
    console.log(`📤 Sending Message: "${message}" to Topic: "${topic}"...`);
    await producer.send({
      topic,
      messages: [{ key: `key-${Date.now()}`, value: message }]
    });
    console.log("✅ Message successfully sent!");
    // await producer.disconnect();
    res.json({ success: true, message: "Message sent!" });
  } catch (error) {
    console.error("Error publishing message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// API to fetch messages stored in memory
app.get("/messages", async (req, res) => {
  res.json(Array.isArray(messages) ? messages : []);
});

app.get("/topics", async (req, res) => {
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();

    res.json(Array.isArray(topics) ? topics : []); // Always return an array
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json([]); // Return an empty array on failure
  }
});

app.listen(5000, () => console.log("Kafka Server running on port 5000"));

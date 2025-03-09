import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string;
  value: string;
  timestamp: string;
}

export default function Dashboard() {
  const [messages, setMessages] = useState<KafkaMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<KafkaMessage | null>(
    null
  );
  const [topics, setTopics] = useState<string[]>([]); // Store Kafka topics

  // Fetch Kafka topics
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("http://localhost:5000/messages");
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []); // Ensure it's an array
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll Kafka messages every 5 seconds
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch("http://localhost:5000/topics");
        const data = await response.json();

        // Ensure topics is an array before setting state
        if (Array.isArray(data)) {
          setTopics(data);
          if (data.length > 0) setTopic(data[0]); // Default to first topic
        } else {
          console.error("Invalid response format:", data);
          setTopics([]); // Set an empty array if response is not an array
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
        setTopics([]); // Prevent UI crashes
      }
    };

    fetchTopics();
  }, []);

  // Publish message to Kafka
  const sendMessage = async () => {
    if (!message.trim() || !topic.trim()) return;

    await fetch("http://localhost:5000/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, message })
    });

    setMessage(""); // Clear message input after sending
  };

  // Open dialog with selected message
  const handleOpenDialog = (message: KafkaMessage) => {
    setSelectedMessage(message);
    setOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Kafka Dashboard
      </Typography>

      {/* Publish Message Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Publish Message
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Topic</InputLabel>
            <Select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={topics.length === 0}
            >
              {topics.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Enter message..."
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            fullWidth
          >
            Send
          </Button>
        </CardContent>
      </Card>

      {/* Kafka Messages Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Received Messages
          </Typography>

          {loading ? (
            <CircularProgress sx={{ display: "block", mx: "auto", my: 3 }} />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Topic</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Key</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Value</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Partition</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Offset</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No messages received
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.map((msg, index) => (
                      <TableRow key={index}>
                        <TableCell>{msg.topic}</TableCell>
                        <TableCell>{msg.key || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleOpenDialog(msg)}
                          >
                            View Message
                          </Button>
                        </TableCell>
                        <TableCell>{msg.partition}</TableCell>
                        <TableCell>{msg.offset}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Message Pop-Up Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <div>
              <p>
                <strong>Topic:</strong> {selectedMessage.topic}
              </p>
              <p>
                <strong>Partition:</strong> {selectedMessage.partition}
              </p>
              <p>
                <strong>Offset:</strong> {selectedMessage.offset}
              </p>
              <p>
                <strong>Key:</strong> {selectedMessage.key}
              </p>
              <p>
                <strong>Timestamp:</strong> {selectedMessage.timestamp}
              </p>
              <p>
                <strong>Message:</strong> {selectedMessage.value}
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  TextField,
  Card,
  CardContent,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
    <Container sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Kafka Dashboard
      </Typography>

      {/* Replace Grid with Box and Stack */}
      <Box display="flex" gap={2}>
        {/* Publish Message Form */}
        <Card sx={{ flex: 1, height: "500px" }}>
          <CardContent>
            <Typography variant="h6">Publish Message</Typography>
            <Stack spacing={2}>
              {/* Topic Dropdown */}
              <FormControl fullWidth>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  {topics.map((topic) => (
                    <MenuItem key={topic} value={topic}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Message Text Field */}
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              {/* Send Button */}
              <Button variant="contained" color="primary" onClick={sendMessage}>
                Send
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card sx={{ flex: 2, height: "500px", overflow: "hidden" }}>
          <CardContent>
            <Typography variant="h6">Messages</Typography>
            {/* Message Table */}
            <TableContainer component={Paper} sx={{ maxHeight: 350 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Topic</TableCell>
                    <TableCell>Partition</TableCell>
                    <TableCell>Offset</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.map((msg, index) => (
                    <TableRow key={index}>
                      <TableCell>{msg.topic}</TableCell>
                      <TableCell>{msg.partition}</TableCell>
                      <TableCell>{msg.offset}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleOpenDialog(msg)}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell>{msg.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Pop-out Message Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
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
                <strong>Message:</strong> {selectedMessage.value}
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

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
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ThemeToggle } from "./Header";

interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string;
  value: string;
  timestamp: string;
}

interface KafkaConfig {
  clientId: string;
  brokers: string;
}

interface KafkaPartitionInfo {
  partition: number;
  messageCount: number;
  keys: string[];
}

interface KafkaMetadata {
  topics: {
    name: string;
    partitions: KafkaPartitionInfo[];
  }[];
  consumerGroups: string[];
  brokers: string[];
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
  const [kafkaConfig, setKafkaConfig] = useState<KafkaConfig>({
    clientId: "",
    brokers: ""
  });

  const [kafkaMetadata, setKafkaMetadata] = useState<KafkaMetadata>({
    topics: [],
    consumerGroups: [],
    brokers: []
  });

  useEffect(() => {
    fetchKafkaConfig();
    fetchKafkaMetadata();
    const interval = setInterval(fetchKafkaMetadata, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

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

  // Fetch current Kafka config from the server
  const fetchKafkaConfig = async () => {
    try {
      const response = await fetch("http://localhost:5000/kafka-config");
      const data = await response.json();
      setKafkaConfig(data);
    } catch (error) {
      console.error("Error fetching Kafka config:", error);
    }
  };

  // Fetch Kafka Metadata
  const fetchKafkaMetadata = async () => {
    try {
      const response = await fetch("http://localhost:5000/kafka-metadata");
      const data = await response.json();
      setKafkaMetadata(data);
    } catch (error) {
      console.error("Error fetching Kafka metadata:", error);
    }
  };

  // Save Kafka config
  const saveKafkaConfig = async () => {
    try {
      await fetch("http://localhost:5000/set-kafka-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kafkaConfig)
      });
      fetchKafkaConfig(); // Reload after saving
    } catch (error) {
      console.error("Error saving Kafka config:", error);
    }
  };
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
      {/* <Typography variant="h5" gutterBottom>
        Kafka Dashboard <ThemeToggle></ThemeToggle>
      </Typography> */}
      <AppBar position="static" sx={{ borderRadius: 3, mx: 2, my: 1, ml: 0 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Kafka Dashboard <ThemeToggle></ThemeToggle>
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Accordion for Kafka Config */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Kafka Server Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Client ID"
              value={kafkaConfig.clientId}
              onChange={(e) =>
                setKafkaConfig({ ...kafkaConfig, clientId: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Brokers (comma-separated)"
              value={kafkaConfig.brokers}
              onChange={(e) =>
                setKafkaConfig({ ...kafkaConfig, brokers: e.target.value })
              }
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              onClick={saveKafkaConfig}
            >
              Save Kafka Config
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Accordion for Kafka Metadata */}
      <Accordion defaultExpanded sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Kafka Metadata</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" spacing={3}>
            {/* Brokers Section - List View */}
            <Card sx={{ minWidth: 250, flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  Brokers
                </Typography>
                <List dense>
                  {kafkaMetadata.brokers && kafkaMetadata.brokers.length > 0 ? (
                    kafkaMetadata.brokers.map((broker, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={broker} />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2">
                      No brokers available
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Consumer Groups Section - List View */}
            <Card sx={{ minWidth: 250, flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  Consumer Groups
                </Typography>

                <List dense>
                  {kafkaMetadata.consumerGroups &&
                  kafkaMetadata.consumerGroups.length > 0 ? (
                    kafkaMetadata.consumerGroups.map((group, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={group} />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2">No consumer groups</Typography>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Topics & Partitions Table */}
            {/* Topics & Partitions Table */}
            <Card sx={{ flex: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  Topics & Partitions
                </Typography>
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Topic</TableCell>
                        <TableCell>Partition</TableCell>
                        <TableCell>Message Count</TableCell>
                        <TableCell>Keys</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {kafkaMetadata.topics &&
                      kafkaMetadata.topics.length > 0 ? (
                        kafkaMetadata.topics.map(
                          (topic) =>
                            topic.partitions &&
                            topic.partitions.map((partition) => (
                              <TableRow
                                key={`${topic.name}-${partition.partition}`}
                              >
                                <TableCell>{topic.name}</TableCell>
                                <TableCell>{partition.partition}</TableCell>
                                <TableCell>{partition.messageCount}</TableCell>
                                <TableCell>
                                  {partition.keys.join(", ") || "No keys"}
                                </TableCell>
                              </TableRow>
                            ))
                        )
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No topics available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Stack>
        </AccordionDetails>
      </Accordion>

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

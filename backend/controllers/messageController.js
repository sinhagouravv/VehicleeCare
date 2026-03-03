const Message = require('../models/Message');
const { createAdminNotification } = require('./notificationController');

// Create a new message from the contact form
exports.createMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, company, message, type } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Please provide all required fields." });
        }

        // Generate custom 7-character unique message ID
        // Format rules:
        // 1. Starts with "69" (positions 0, 1)
        // 2. Length is exactly 7 characters
        // 3. No "0" allowed
        // 4. No repeating characters
        // 5. Positions 3 and 4 (4th and 5th characters) must be alphabets
        // Positions: 
        // 0: '6'
        // 1: '9'
        // 2: Digit (1-8)
        // 3: Alphabet
        // 4: Alphabet
        // 5: Digit (1-8)
        // 6: Digit (1-8)

        let messageId;
        let isUnique = false;

        const generateCustomId = () => {
            const digits = "1234578"; // no 0, no 6, no 9 (since 69 are used)
            const alphabets = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed I, O for clarity, optional

            let idChars = ['6', '9']; // Positions 0, 1
            let used = new Set(['6', '9']);

            const getRandomChar = (options) => {
                let char;
                do {
                    char = options[Math.floor(Math.random() * options.length)];
                } while (used.has(char));
                used.add(char);
                return char;
            };

            // Pos 2: Digit
            idChars.push(getRandomChar(digits));

            // Pos 3: Alphabet (4th char)
            idChars.push(getRandomChar(alphabets));

            // Pos 4: Alphabet (5th char)
            idChars.push(getRandomChar(alphabets));

            // Pos 5: Digit
            idChars.push(getRandomChar(digits));

            // Pos 6: Digit
            idChars.push(getRandomChar(digits));

            return idChars.join('');
        };

        while (!isUnique) {
            messageId = generateCustomId();
            const existingId = await Message.findOne({ messageId });
            if (!existingId) {
                isUnique = true;
            }
        }

        const newMessage = new Message({
            messageId,
            name,
            email,
            phone,
            company,
            subject,
            message,
            type: type || 'website'
        });

        await newMessage.save();

        // Fire admin notification
        createAdminNotification({
            eventType: 'message_received',
            title: 'New Contact Message',
            message: `${name} (${email}) sent a message.`,
            meta: { messageId: newMessage.messageId, name, email, type }
        });

        res.status(201).json({ success: true, message: "Message sent successfully!", data: newMessage });
    } catch (err) {
        console.error("Error creating message:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get all messages for admin
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Mark message as read/unread
exports.toggleMessageStatus = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        message.isRead = !message.isRead;
        await message.save();

        res.status(200).json({ success: true, data: message });
    } catch (err) {
        console.error("Error updating message status:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

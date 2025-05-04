// Helper function to make Telegram API requests (internal)
async function makeTelegramRequest(botToken: string, method: string, params: Record<string, any> = {}): Promise<any> {
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${botToken}/${method}`;
    try {
        const response = await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        const data = await response.json();

        // Log the error but return the data containing 'ok: false' and 'description'
        // Let the calling function decide how to handle the specific error.
        if (!response.ok || !data.ok) {
            console.error(`Telegram API Error (${method}, Status: ${response.status}): ${data.description || 'Unknown error'}`);
            // Return the error response instead of throwing immediately
            // This allows the caller (e.g., validateChatId) to check the specific error message.
             return data; // e.g., { ok: false, error_code: 400, description: "Bad Request: chat not found" }
        }

        return data; // Contains { ok: true, result: ... }
    } catch (error) {
        console.error(`Error during Telegram request (${method}):`, error);
        // Rethrow a generic error for network/parsing issues
        throw new Error(`Failed to execute Telegram API method ${method}: ${error instanceof Error ? error.message : error}`);
    }
}


/**
 * Asynchronously sends a message to a Telegram group via a bot.
 *
 * Uses the actual Telegram Bot API.
 * Handles potential errors (invalid token, chat not found, rate limits).
 *
 * @param message The message text to send. Supports basic MarkdownV2 or HTML formatting.
 * @param botToken The Telegram bot token.
 * @param chatId The Telegram chat ID (can be a user ID or a group/channel ID).
 * @param parseMode Optional parse mode ('MarkdownV2' or 'HTML'). Defaults to undefined (plain text).
 * @returns A promise that resolves when the message is attempted to be sent. It might not guarantee delivery success on Telegram's side, but confirms the API call was made.
 * @throws Error if the API call fails significantly (e.g., network error, invalid token, or specific Telegram error).
 */
export async function sendMessage(
  message: string,
  botToken: string,
  chatId: string,
  parseMode?: 'MarkdownV2' | 'HTML'
): Promise<void> {
   // Basic validation
   if (!botToken || !chatId || !message) {
     console.error("Telegram sendMessage: Missing botToken, chatId, or message.");
     throw new Error("Missing required parameters for sending Telegram message.");
   }

   console.log(`Attempting to send message to Telegram Chat ID ${chatId}: "${message.substring(0, 50)}..."`);

   try {
       const params: Record<string, any> = {
           chat_id: chatId,
           text: message,
       };
       if (parseMode) {
           params.parse_mode = parseMode;
       }

       const response = await makeTelegramRequest(botToken, 'sendMessage', params);

       // Check if the API call itself reported an error (e.g., chat not found)
       if (!response.ok) {
            throw new Error(`Telegram API Error (sendMessage): ${response.description || `Error code ${response.error_code}`}`);
        }

       console.log("Telegram sendMessage: API request successful.");

   } catch (error) {
       console.error("Error sending Telegram message via API:", error);
       // Rethrow the error to be handled by the caller
       throw error;
   }
}

/**
 * Validates a Telegram Bot Token by calling the `getMe` API method.
 * @param botToken The Telegram bot token to validate.
 * @returns True if the token is valid (API call succeeds), false otherwise.
 */
export async function validateBotToken(botToken: string): Promise<boolean> {
    if (!botToken) return false;
    console.log("Validating Telegram Bot Token...");
    try {
        const response = await makeTelegramRequest(botToken, 'getMe');
        // Check the 'ok' field in the response
        const isValid = response && response.ok === true;
        console.log("Telegram Bot Token validation result:", isValid);
        return isValid;
    } catch (error) {
         // Log the error but return false for validation purposes (covers network errors etc.)
        console.warn("Telegram Bot Token validation failed (request error):", error);
        return false;
    }
}

/**
 * Validates a Telegram Chat ID by attempting to send a 'typing' action.
 * This is less intrusive than sending a message. Requires a valid bot token.
 * @param botToken A *valid* Telegram bot token.
 * @param chatId The Chat ID to validate.
 * @returns True if the chat ID is valid and the bot has access, false otherwise.
 * @throws Error specifically if the error indicates 'chat not found' to allow specific handling.
 */
export async function validateChatId(botToken: string, chatId: string): Promise<boolean> {
     if (!botToken || !chatId) return false;
     console.log(`Validating Telegram Chat ID: ${chatId}...`);
    try {
        // Sending 'typing' action is a good way to check access without sending a visible message
        const response = await makeTelegramRequest(botToken, 'sendChatAction', {
            chat_id: chatId,
            action: 'typing',
        });
         // Check the 'ok' field in the response
         const isValid = response && response.ok === true;
         console.log(`Telegram Chat ID ${chatId} validation result:`, isValid);

          // If not valid, check for specific 'chat not found' error and throw it
         if (!isValid && response.description && response.description.toLowerCase().includes('chat not found')) {
            throw new Error(`Telegram API Error: chat not found`); // Throw specific error
         }

         return isValid; // Return true if ok, false for other errors
    } catch (error) {
        // Log the error but return false for validation purposes, unless it's the specific "chat not found" error which is re-thrown
        console.warn(`Telegram Chat ID ${chatId} validation failed:`, error);
        // If the error is the specific one we threw, re-throw it
        if (error instanceof Error && error.message.includes('chat not found')) {
             throw error;
         }
        // For other errors (network, parsing, different Telegram errors), return false
        return false;
    }
}

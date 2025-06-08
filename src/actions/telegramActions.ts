'use server';
/**
 * @fileOverview Server actions for Telegram integration (validation and messaging).
 */

import {
    sendMessage as sendTelegramMessageService,
    validateBotToken as validateTelegramBotTokenService,
    validateChatId as validateTelegramChatIdService
} from '@/services/telegram';

/**
 * Validates a Telegram Bot Token.
 * @param token The Telegram bot token.
 * @returns Promise resolving to an object with validation status and message.
 */
export async function validateTelegramTokenAction(
    token: string
): Promise<{ isValid: boolean; message: string }> {
    console.log("Server Action: Validating Telegram Bot Token...");
    if (!token) {
        return { isValid: false, message: "Telegram Bot Token girilmelidir." };
    }
    try {
        const isValid = await validateTelegramBotTokenService(token);
        const message = isValid ? "Bot token geçerli." : "Bot token geçersiz veya Telegram API'ye ulaşılamadı. Lütfen token'ı kontrol edin ve internet bağlantınızı doğrulayın.";
        console.log(`Server Action: Telegram Token Validation: ${message}`);
        return { isValid, message };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
        console.error("Server Action (validateTelegramTokenAction) Error:", errorMsg);
        return { isValid: false, message: `Token doğrulanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.` };
    }
}

/**
 * Validates a Telegram Chat ID.
 * @param token A valid Telegram bot token.
 * @param chatId The Chat ID to validate.
 * @returns Promise resolving to an object with validation status and message.
 */
export async function validateTelegramChatIdAction(
    token: string,
    chatId: string
): Promise<{ isValid: boolean; message: string }> {
    console.log(`Server Action: Validating Telegram Chat ID ${chatId}...`);
     if (!token || !chatId) {
        return { isValid: false, message: "Telegram Bot Token ve Chat ID girilmelidir." };
    }
    try {
        const isValid = await validateTelegramChatIdService(token, chatId);
        console.log(`Server Action: Telegram Chat ID ${chatId} validation successful.`);
        return { isValid: true, message: `Chat ID (${chatId}) geçerli.` };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
        console.warn(`Server Action: Telegram Chat ID ${chatId} validation failed:`, errorMsg);
        if (errorMsg.toLowerCase().includes('chat not found')) {
            return { isValid: false, message: `Chat ID (${chatId}) bulunamadı. Lütfen ID'yi kontrol edin ve botun sohbete eklendiğinden/başlatıldığından emin olun.`};
        }
        return { isValid: false, message: `Chat ID (${chatId}) doğrulanırken bir hata oluştu. Lütfen token, ID ve internet bağlantınızı kontrol edin.` };
    }
}

/**
 * Sends a message via Telegram.
 * @param token The Telegram bot token.
 * @param chatId The Telegram chat ID.
 * @param messageText The message to send.
 * @param parseMode Optional parse mode ('MarkdownV2' or 'HTML').
 * @returns Promise resolving to an object indicating success and an optional message.
 */
export async function sendTelegramMessageAction(
    token: string,
    chatId: string,
    messageText: string,
    parseMode?: 'MarkdownV2' | 'HTML'
): Promise<{ success: boolean; message?: string }> {
    console.log(`Server Action: Sending Telegram message to ${chatId}: "${messageText.substring(0,30)}..."`);
    if (!token || !chatId || !messageText) {
        return { success: false, message: "Mesaj gönderimi için eksik parametreler (token, chatId, mesaj)." };
    }
    try {
        await sendTelegramMessageService(messageText, token, chatId, parseMode);
        console.log(`Server Action: Telegram message sent successfully to ${chatId}.`);
        return { success: true };
    } catch (error) {
        // Error from makeTelegramRequest (e.g. specific Telegram API error)
        // or Error from sendTelegramMessageService if it throws for other reasons
        const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
        console.error("Server Action (sendTelegramMessageAction) Error:", errorMsg);
        
        let userFriendlyMessage = "Telegram mesajı gönderilemedi. Lütfen ayarlarınızı ve internet bağlantınızı kontrol edin.";
        // Try to parse more specific Telegram errors if available in errorMsg
        if (errorMsg.includes("chat not found")) {
            userFriendlyMessage = `Telegram mesajı gönderilemedi: Chat ID (${chatId}) bulunamadı.`;
        } else if (errorMsg.includes("bot token") || errorMsg.includes("Unauthorized")) {
            userFriendlyMessage = "Telegram mesajı gönderilemedi: Geçersiz bot token.";
        } else if (errorMsg.includes("Wrong type of chat") || errorMsg.includes("bot can't initiate conversation")) {
            userFriendlyMessage = `Telegram mesajı gönderilemedi: Bot bu Chat ID (${chatId}) ile iletişim kuramıyor. Botun sohbete eklendiğinden ve mesaj gönderme izni olduğundan emin olun.`;
        }
        
        return { success: false, message: userFriendlyMessage };
    }
}

import axios from 'axios';

const getApiConfig = () => {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        throw new Error('WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN) are missing in environment variables.');
    }

    return {
        apiUrl: `https://graph.facebook.com/v22.0/${phoneNumberId}`,
        accessToken
    };
};

export const sendWhatsappMessage = async ({ to, message }) => {
    const { apiUrl, accessToken } = getApiConfig();
    try {
        const response = await axios.post(
            `${apiUrl}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: message },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        const apiError = error.response?.data?.error?.message || error.message;
        console.error("[WHATSAPP] Failed to send message:", apiError);
        return { success: false, error: apiError };
    }
};

export const sendWhatsappTemplate = async ({ to, templateName, languageCode = "en_US" }) => {
    const { apiUrl, accessToken } = getApiConfig();
    try {
        const response = await axios.post(
            `${apiUrl}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        const apiError = error.response?.data?.error?.message || error.message;
        console.error("[WHATSAPP] Failed to send template:", apiError);
        return { success: false, error: apiError };
    }
};
